import Imap from 'node-imap';
import { simpleParser } from 'mailparser';
import { config } from '../config/index.js';
import { supabase } from '../config/database.js';
import { jobService } from './job.service.js';
import { mathpixService } from './mathpix.service.js';
import { logger } from '../utils/logger.js';

export const emailInboundService = {
  imap: null,
  connected: false,
  monitoring: false,
  currentFolder: 'INBOX',

  /**
   * Connect to IMAP server
   */
  connect() {
    return new Promise((resolve, reject) => {
      if (!config.imap.user || !config.imap.password) {
        logger.warn('EMAIL', 'IMAP credentials not configured - skipping');
        return resolve();
      }

      logger.info('EMAIL', `Connecting to ${config.imap.host}...`);

      this.imap = new Imap({
        user: config.imap.user,
        password: config.imap.password,
        host: config.imap.host,
        port: config.imap.port,
        tls: config.imap.tls,
        tlsOptions: { rejectUnauthorized: false },
        keepalive: config.imap.keepalive,
        authTimeout: config.imap.authTimeout,
        connTimeout: config.imap.connTimeout,
      });

      this.imap.once('ready', () => {
        this.connected = true;
        logger.success('EMAIL', 'Connected to IMAP server');
        resolve();
      });

      this.imap.once('error', (err) => {
        logger.error('EMAIL', `Connection error: ${err.message}`);
        this.connected = false;
        reject(err);
      });

      this.imap.once('end', () => {
        this.connected = false;
        logger.info('EMAIL', 'Connection ended');
      });

      this.imap.connect();
    });
  },

  /**
   * Disconnect from IMAP server
   */
  disconnect() {
    this.monitoring = false;
    if (this.imap) {
      this.imap.end();
      this.imap = null;
    }
    this.connected = false;
    logger.info('EMAIL', 'Disconnected');
  },

  /**
   * Check if connected
   */
  isConnected() {
    return this.connected;
  },

  /**
   * Open a folder
   */
  openFolder(folder, readOnly = false) {
    return new Promise((resolve, reject) => {
      if (!this.imap) return reject(new Error('Not connected'));

      this.imap.openBox(folder, readOnly, (err, box) => {
        if (err) return reject(err);
        this.currentFolder = folder;
        resolve(box);
      });
    });
  },

  /**
   * Start monitoring folder for new emails using IMAP IDLE
   */
  async startMonitoring(folder = 'INBOX') {
    if (!this.imap || !this.connected) {
      logger.warn('EMAIL', 'Cannot start monitoring - not connected');
      return;
    }

    await this.openFolder(folder, false);
    this.monitoring = true;

    // Listen for new mail
    this.imap.on('mail', async (numNewMsgs) => {
      logger.info('EMAIL', `${numNewMsgs} new email(s) detected`);

      try {
        await this.fetchNewEmails(numNewMsgs, folder);
      } catch (err) {
        logger.error('EMAIL', `Error fetching emails: ${err.message}`);
      }
    });

    logger.success('EMAIL', `IDLE monitoring on ${folder}`);
  },

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.monitoring = false;
    logger.info('EMAIL', 'Monitoring stopped');
  },

  /**
   * Fetch the newest emails
   */
  async fetchNewEmails(count, folder) {
    return new Promise((resolve, reject) => {
      if (!this.imap) return reject(new Error('Not connected'));

      // Search for recent unseen emails
      this.imap.search(['UNSEEN'], async (err, uids) => {
        if (err) return reject(err);

        if (!uids || uids.length === 0) {
          logger.debug('EMAIL', 'No unseen emails found');
          return resolve([]);
        }

        // Take the last 'count' emails
        const targetUids = uids.slice(-count);
        logger.info('EMAIL', `Processing ${targetUids.length} email(s)`);

        for (const uid of targetUids) {
          try {
            const email = await this.fetchSingleEmail(uid);
            if (email) {
              await this.processEmail(email);
            }
          } catch (fetchErr) {
            logger.error('EMAIL', `Error processing UID ${uid}: ${fetchErr.message}`);
          }
        }

        resolve(targetUids);
      });
    });
  },

  /**
   * Fetch a single email by UID
   */
  fetchSingleEmail(uid) {
    return new Promise((resolve, reject) => {
      if (!this.imap) return reject(new Error('Not connected'));

      const fetch = this.imap.fetch([uid], {
        bodies: '',
        struct: true,
        markSeen: true,
      });

      let emailData = [];
      let attributes = null;

      fetch.on('message', (msg) => {
        msg.on('body', (stream) => {
          const chunks = [];
          stream.on('data', (chunk) => chunks.push(chunk));
          stream.on('end', () => {
            emailData = chunks;
          });
        });

        msg.once('attributes', (attrs) => {
          attributes = attrs;
        });
      });

      fetch.once('error', reject);

      fetch.once('end', async () => {
        if (emailData.length === 0) {
          return resolve(null);
        }

        try {
          const rawEmail = Buffer.concat(emailData);
          const parsed = await simpleParser(rawEmail);

          resolve({
            uid,
            messageId: parsed.messageId,
            subject: parsed.subject || '(No subject)',
            from: parsed.from?.value?.[0] || { address: 'unknown' },
            to: parsed.to?.value || [],
            date: parsed.date || new Date(),
            text: parsed.text,
            html: parsed.html,
            attachments: (parsed.attachments || []).map((att) => ({
              filename: att.filename || 'unnamed',
              contentType: att.contentType || 'application/octet-stream',
              size: att.size || 0,
              content: att.content, // Buffer
            })),
            attributes,
          });
        } catch (parseErr) {
          reject(parseErr);
        }
      });
    });
  },

  /**
   * Process an email - extract PDF attachments and store in scanned_items
   */
  async processEmail(email) {
    logger.info('EMAIL', `Processing: "${email.subject}" from ${email.from.address}`);

    // Get active job
    const activeJob = await jobService.getActiveJob();

    if (!activeJob) {
      logger.warn('EMAIL', `No active job - skipping: ${email.subject}`);
      return;
    }

    // Filter PDF attachments
    const pdfAttachments = email.attachments.filter(
      (att) => att.contentType === 'application/pdf' || att.filename?.toLowerCase().endsWith('.pdf')
    );

    if (pdfAttachments.length === 0) {
      logger.debug('EMAIL', 'No PDF attachments - skipping');
      return;
    }

    logger.info('EMAIL', `Found ${pdfAttachments.length} PDF attachment(s)`);

    for (const attachment of pdfAttachments) {
      try {
        await this.saveAttachmentAsScannedItem(attachment, email, activeJob);
      } catch (err) {
        logger.error('EMAIL', `Failed to save "${attachment.filename}": ${err.message}`);
      }
    }
  },

  /**
   * Save a PDF attachment as a scanned item
   */
  async saveAttachmentAsScannedItem(attachment, email, activeJob) {
    logger.info('SCAN', `Saving: ${attachment.filename} (${Math.round(attachment.size / 1024)}KB)`);

    // Insert into scanned_items with BYTEA content
    const { data, error } = await supabase
      .from('scanned_items')
      .insert({
        book_id: activeJob.active_book_id,
        chapter_id: activeJob.active_chapter_id,
        item_type: activeJob.active_item_type || 'question',
        item_data: attachment.filename, // Store filename in item_data
        content: attachment.content, // BYTEA - raw PDF binary
        scan_type: 'email_attachment',
        status: 'pending',
        latex_conversion_status: 'pending',
        metadata: {
          email_subject: email.subject,
          email_from: email.from.address,
          email_date: email.date,
          email_message_id: email.messageId,
          filename: attachment.filename,
          size: attachment.size,
          content_type: attachment.contentType,
        },
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.success('SCAN', `Created item: ${data.id}`);

    // Trigger MathPix conversion asynchronously
    this.triggerMathPixConversion(data.id, attachment.content);

    return data;
  },

  /**
   * Trigger MathPix conversion for email attachment
   */
  async triggerMathPixConversion(scannedItemId, contentBuffer) {
    try {
      logger.info('MATHPIX', `Starting conversion for ${scannedItemId}`);
      // Convert buffer to base64 for MathPix API
      const base64Content = contentBuffer.toString('base64');
      await mathpixService.convertPdfToLatex(base64Content, scannedItemId);
      logger.success('MATHPIX', `Conversion complete: ${scannedItemId}`);
    } catch (err) {
      logger.error('MATHPIX', `Conversion failed for ${scannedItemId}: ${err.message}`);
    }
  },

  /**
   * Get connection status info
   */
  getStatus() {
    return {
      connected: this.connected,
      monitoring: this.monitoring,
      currentFolder: this.currentFolder,
      email: config.imap.user,
      host: config.imap.host,
    };
  },
};

export default emailInboundService;
