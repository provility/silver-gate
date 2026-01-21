# Standalone IMAP Email Client - Node.js + Express + JavaScript

A reusable, self-contained IMAP email client for monitoring emails, fetching attachments, and processing them via callbacks. Pure JavaScript implementation with Express server.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Structure](#project-structure)
3. [Dependencies](#dependencies)
4. [Environment Configuration](#environment-configuration)
5. [Core Implementation](#core-implementation)
6. [Express Server Integration](#express-server-integration)
7. [Usage Examples](#usage-examples)
8. [API Endpoints](#api-endpoints)
9. [IMAP Concepts](#imap-concepts)

---

## Quick Start

```bash
# Create project
mkdir email-client && cd email-client
npm init -y

# Install dependencies
npm install express node-imap mailparser dotenv

# Create files (see below)
# Set up .env
# Run
node index.js
```

---

## Project Structure

```
email-client/
├── src/
│   ├── email-client.js      # IMAP client implementation
│   ├── email-store.js       # Storage adapter (console/DB)
│   └── routes/
│       └── emails.js        # Express routes
├── index.js                 # Express server entry
├── .env                     # Environment variables
└── package.json
```

---

## Dependencies

```json
{
  "name": "email-client",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "node-imap": "^0.9.6",
    "mailparser": "^3.7.4",
    "dotenv": "^16.3.1"
  }
}
```

---

## Environment Configuration

Create `.env` file:

```env
# IMAP Server Configuration
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_TLS=true

# Authentication
EMAIL_ADDRESS=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Optional: Connection settings
IMAP_KEEPALIVE=true
IMAP_KEEPALIVE_INTERVAL=10000
IMAP_AUTH_TIMEOUT=30000
IMAP_CONN_TIMEOUT=30000

# Server
PORT=3000
```

### Gmail App Password Setup

1. Enable 2-Factor Authentication on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Select "Mail" and your device
4. Copy the 16-character password
5. Use this as `EMAIL_PASSWORD`

### Other Email Providers

| Provider | IMAP Host | Port |
|----------|-----------|------|
| Gmail | imap.gmail.com | 993 |
| Outlook/Hotmail | outlook.office365.com | 993 |
| Yahoo | imap.mail.yahoo.com | 993 |
| iCloud | imap.mail.me.com | 993 |

---

## Core Implementation

### `src/email-client.js`

```javascript
const Imap = require("node-imap");
const { simpleParser } = require("mailparser");

/**
 * IMAP Email Client
 *
 * Callbacks:
 *   onEmail(email) - Called when email is fetched. Return true to acknowledge.
 *   onAttachment(attachment, email) - Called for each attachment (optional)
 *   onError(error, context) - Called on errors
 *   onConnectionStateChange(state) - Called when connection state changes
 */
class EmailClient {
  constructor(config, callbacks) {
    this.config = config;
    this.callbacks = callbacks;
    this.imap = null;
    this.connected = false;
    this.monitoring = false;
    this.currentFolder = "INBOX";
  }

  // ==========================================================================
  // CONNECTION MANAGEMENT
  // ==========================================================================

  connect() {
    return new Promise((resolve, reject) => {
      this.callbacks.onConnectionStateChange?.("connecting");

      this.imap = new Imap({
        user: this.config.user,
        password: this.config.password,
        host: this.config.host,
        port: this.config.port,
        tls: this.config.tls,
        tlsOptions: { rejectUnauthorized: false },
        keepalive: this.config.keepalive ?? true,
        authTimeout: this.config.authTimeout ?? 30000,
        connTimeout: this.config.connTimeout ?? 30000,
      });

      this.imap.once("ready", () => {
        this.connected = true;
        this.callbacks.onConnectionStateChange?.("connected");
        resolve();
      });

      this.imap.once("error", (err) => {
        this.callbacks.onError?.(err, "connection");
        this.callbacks.onConnectionStateChange?.("error");
        reject(err);
      });

      this.imap.once("end", () => {
        this.connected = false;
        this.callbacks.onConnectionStateChange?.("disconnected");
      });

      this.imap.connect();
    });
  }

  disconnect() {
    this.monitoring = false;
    if (this.imap) {
      this.imap.end();
      this.imap = null;
    }
    this.connected = false;
  }

  isConnected() {
    return this.connected;
  }

  // ==========================================================================
  // FOLDER OPERATIONS
  // ==========================================================================

  listFolders() {
    return new Promise((resolve, reject) => {
      if (!this.imap) return reject(new Error("Not connected"));

      this.imap.getBoxes((err, boxes) => {
        if (err) return reject(err);

        const folders = [];
        const extractFolders = (boxObj, prefix = "") => {
          for (const name of Object.keys(boxObj)) {
            const fullName = prefix
              ? `${prefix}${boxObj[name].delimiter}${name}`
              : name;
            folders.push(fullName);
            if (boxObj[name].children) {
              extractFolders(boxObj[name].children, fullName);
            }
          }
        };
        extractFolders(boxes);
        resolve(folders);
      });
    });
  }

  openFolder(folder, readOnly = false) {
    return new Promise((resolve, reject) => {
      if (!this.imap) return reject(new Error("Not connected"));

      this.imap.openBox(folder, readOnly, (err, box) => {
        if (err) return reject(err);
        this.currentFolder = folder;
        resolve(box);
      });
    });
  }

  // ==========================================================================
  // EMAIL FETCHING
  // ==========================================================================

  /**
   * Fetch emails matching criteria
   *
   * @param {Object} criteria - Search criteria
   * @param {string} criteria.from - From address filter
   * @param {string} criteria.to - To address filter
   * @param {string} criteria.subject - Subject filter
   * @param {Date} criteria.since - Emails after this date
   * @param {Date} criteria.before - Emails before this date
   * @param {boolean} criteria.unread - Only unread emails
   * @param {boolean} criteria.starred - Only starred/flagged emails
   * @param {string} criteria.gmailQuery - Gmail native search (X-GM-RAW)
   * @param {number} criteria.limit - Max emails to fetch
   * @param {string} folder - Folder to search (default: INBOX)
   * @returns {Promise<Array>} Array of email objects
   */
  async fetchEmails(criteria = {}, folder = "INBOX") {
    await this.openFolder(folder, true);

    const uids = await this.searchMailbox(criteria);
    if (uids.length === 0) return [];

    // Apply limit and reverse for newest first
    const limitedUids = criteria.limit
      ? uids.slice(-criteria.limit).reverse()
      : uids.reverse();

    const emails = [];

    for (const uid of limitedUids) {
      try {
        const email = await this.fetchSingleEmail(uid, folder);
        if (email) {
          emails.push(email);

          // Trigger callbacks
          await this.callbacks.onEmail(email);

          if (this.callbacks.onAttachment) {
            for (const attachment of email.attachments) {
              await this.callbacks.onAttachment(attachment, email);
            }
          }
        }
      } catch (err) {
        this.callbacks.onError?.(err, `fetch-email-${uid}`);
      }
    }

    return emails;
  }

  /**
   * Fetch single email by UID
   */
  async fetchEmailByUid(uid, folder = "INBOX") {
    await this.openFolder(folder, true);
    return this.fetchSingleEmail(uid, folder);
  }

  /**
   * Search mailbox and return UIDs
   */
  searchMailbox(criteria) {
    return new Promise((resolve, reject) => {
      if (!this.imap) return reject(new Error("Not connected"));

      // Build IMAP search criteria
      const imapCriteria = [];

      // Gmail native search (takes priority)
      if (criteria.gmailQuery) {
        imapCriteria.push(["X-GM-RAW", criteria.gmailQuery]);
      } else {
        // Standard IMAP criteria
        if (criteria.from) imapCriteria.push(["FROM", criteria.from]);
        if (criteria.to) imapCriteria.push(["TO", criteria.to]);
        if (criteria.subject) imapCriteria.push(["SUBJECT", criteria.subject]);
        if (criteria.body) imapCriteria.push(["BODY", criteria.body]);
        if (criteria.since) imapCriteria.push(["SINCE", criteria.since]);
        if (criteria.before) imapCriteria.push(["BEFORE", criteria.before]);
        if (criteria.on) imapCriteria.push(["ON", criteria.on]);
        if (criteria.unread === true) imapCriteria.push("UNSEEN");
        if (criteria.unread === false) imapCriteria.push("SEEN");
        if (criteria.starred) imapCriteria.push("FLAGGED");
        if (criteria.answered) imapCriteria.push("ANSWERED");
        if (criteria.larger) imapCriteria.push(["LARGER", criteria.larger]);
        if (criteria.smaller) imapCriteria.push(["SMALLER", criteria.smaller]);
      }

      // Default: all emails
      if (imapCriteria.length === 0) {
        imapCriteria.push("ALL");
      }

      this.imap.search(imapCriteria, (err, uids) => {
        if (err) return reject(err);
        resolve(uids || []);
      });
    });
  }

  /**
   * Fetch a single email by UID (internal)
   */
  fetchSingleEmail(uid, folder) {
    return new Promise((resolve, reject) => {
      if (!this.imap) return reject(new Error("Not connected"));

      const fetch = this.imap.fetch([uid], {
        bodies: "",
        struct: true,
      });

      let emailData = [];
      let attributes = null;

      fetch.on("message", (msg) => {
        msg.on("body", (stream) => {
          const chunks = [];
          stream.on("data", (chunk) => chunks.push(chunk));
          stream.on("end", () => {
            emailData = chunks;
          });
        });

        msg.once("attributes", (attrs) => {
          attributes = attrs;
        });
      });

      fetch.once("error", reject);

      fetch.once("end", async () => {
        if (emailData.length === 0) {
          return resolve(null);
        }

        try {
          const rawEmail = Buffer.concat(emailData);
          const parsed = await simpleParser(rawEmail);
          const email = this.parseToEmail(parsed, uid, folder, attributes);
          resolve(email);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  /**
   * Convert parsed email to our email format
   */
  parseToEmail(parsed, uid, folder, attributes) {
    // Extract address helper
    const extractAddress = (addr) => ({
      address: addr?.address || "",
      name: addr?.name || undefined,
    });

    const extractAddresses = (addrs) => {
      if (!addrs) return [];
      const arr = Array.isArray(addrs.value) ? addrs.value : [addrs];
      return arr.map(extractAddress);
    };

    // Extract attachments WITH CONTENT
    const attachments = (parsed.attachments || []).map((att) => ({
      filename: att.filename || "unnamed",
      contentType: att.contentType || "application/octet-stream",
      size: att.size || 0,
      contentId: att.contentId || undefined,
      isInline: att.contentDisposition === "inline",
      content: att.content, // Buffer with binary data
    }));

    // Build email object
    const flags = attributes?.flags || [];
    const from = parsed.from?.value?.[0] || { address: "unknown" };

    return {
      // Identifiers
      uid,
      messageId: parsed.messageId || `${uid}@${folder}`,
      threadId: parsed.headers?.get("x-gm-thrid") || undefined,
      inReplyTo: parsed.inReplyTo || undefined,
      references: parsed.references
        ? Array.isArray(parsed.references)
          ? parsed.references
          : [parsed.references]
        : undefined,

      // Timestamps
      date: parsed.date || new Date(),
      receivedDate: attributes?.date || undefined,

      // Addresses
      from: extractAddress(from),
      to: extractAddresses(parsed.to),
      cc: parsed.cc ? extractAddresses(parsed.cc) : undefined,
      bcc: parsed.bcc ? extractAddresses(parsed.bcc) : undefined,
      replyTo: parsed.replyTo?.value?.[0]
        ? extractAddress(parsed.replyTo.value[0])
        : undefined,

      // Content
      subject: parsed.subject || "(No subject)",
      bodyText: parsed.text || undefined,
      bodyHtml: parsed.html || undefined,
      snippet: parsed.text ? parsed.text.substring(0, 200) : undefined,

      // Metadata
      folder,
      flags,
      isRead: flags.includes("\\Seen"),
      isStarred: flags.includes("\\Flagged"),
      size: attributes?.size || 0,

      // Attachments
      hasAttachments: attachments.length > 0,
      attachments,
    };
  }

  // ==========================================================================
  // REAL-TIME MONITORING (IDLE)
  // ==========================================================================

  /**
   * Start monitoring folder for new emails
   * Uses IMAP IDLE for push notifications
   */
  async startMonitoring(folder = "INBOX") {
    if (!this.imap) throw new Error("Not connected");

    await this.openFolder(folder, false);
    this.monitoring = true;

    // Listen for new mail
    this.imap.on("mail", async (numNewMsgs) => {
      console.log(`[IDLE] ${numNewMsgs} new email(s) detected`);

      try {
        // Fetch the new emails
        const emails = await this.fetchEmails({ limit: numNewMsgs }, folder);
        console.log(`[IDLE] Processed ${emails.length} new email(s)`);
      } catch (err) {
        this.callbacks.onError?.(err, "idle-fetch");
      }
    });

    // Listen for email updates (flags changed, etc.)
    this.imap.on("update", (seqno, info) => {
      console.log(`[IDLE] Email ${seqno} updated:`, info);
    });

    console.log(`[IDLE] Monitoring started on ${folder}`);
  }

  stopMonitoring() {
    this.monitoring = false;
    console.log("[IDLE] Monitoring stopped");
  }

  // ==========================================================================
  // EMAIL OPERATIONS
  // ==========================================================================

  async markAsRead(uid, folder = "INBOX") {
    await this.addFlag(uid, "\\Seen", folder);
  }

  async markAsUnread(uid, folder = "INBOX") {
    await this.removeFlag(uid, "\\Seen", folder);
  }

  addFlag(uid, flag, folder = "INBOX") {
    return new Promise(async (resolve, reject) => {
      if (!this.imap) return reject(new Error("Not connected"));
      await this.openFolder(folder, false);

      this.imap.addFlags([uid], [flag], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  removeFlag(uid, flag, folder = "INBOX") {
    return new Promise(async (resolve, reject) => {
      if (!this.imap) return reject(new Error("Not connected"));
      await this.openFolder(folder, false);

      this.imap.delFlags([uid], [flag], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  moveToFolder(uid, targetFolder, sourceFolder = "INBOX") {
    return new Promise(async (resolve, reject) => {
      if (!this.imap) return reject(new Error("Not connected"));
      await this.openFolder(sourceFolder, false);

      this.imap.move([uid], targetFolder, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  async deleteEmail(uid, folder = "INBOX") {
    try {
      await this.moveToFolder(uid, "[Gmail]/Trash", folder);
    } catch {
      // Fallback: mark as deleted
      await this.addFlag(uid, "\\Deleted", folder);
    }
  }
}

// ==========================================================================
// FACTORY FUNCTION
// ==========================================================================

/**
 * Create an EmailClient from environment variables
 *
 * @param {Object} callbacks
 * @param {Function} callbacks.onEmail - Called for each email
 * @param {Function} callbacks.onAttachment - Called for each attachment (optional)
 * @param {Function} callbacks.onError - Called on errors (optional)
 * @param {Function} callbacks.onConnectionStateChange - Called on state change (optional)
 */
function createEmailClient(callbacks) {
  const config = {
    host: process.env.IMAP_HOST || "imap.gmail.com",
    port: parseInt(process.env.IMAP_PORT || "993"),
    tls: process.env.IMAP_TLS !== "false",
    user: process.env.EMAIL_ADDRESS || "",
    password: process.env.EMAIL_PASSWORD || "",
    keepalive: process.env.IMAP_KEEPALIVE !== "false",
    keepaliveInterval: parseInt(process.env.IMAP_KEEPALIVE_INTERVAL || "10000"),
    authTimeout: parseInt(process.env.IMAP_AUTH_TIMEOUT || "30000"),
    connTimeout: parseInt(process.env.IMAP_CONN_TIMEOUT || "30000"),
  };

  if (!config.user || !config.password) {
    throw new Error(
      "EMAIL_ADDRESS and EMAIL_PASSWORD environment variables are required"
    );
  }

  return new EmailClient(config, callbacks);
}

module.exports = { EmailClient, createEmailClient };
```

---

### `src/email-store.js`

This is your storage adapter. Replace console.log with your actual database calls.

```javascript
/**
 * Email Storage Adapter
 *
 * Replace these console.log statements with your actual database calls.
 * Examples: MongoDB, PostgreSQL, MySQL, etc.
 */

// In-memory store for demo (replace with your DB)
const emailStore = [];
const attachmentStore = [];

/**
 * Save an email to the database
 * @param {Object} email - Email object from EmailClient
 * @returns {Promise<number>} - Email ID in database
 */
async function saveEmail(email) {
  console.log("========================================");
  console.log("[DB] SAVING EMAIL");
  console.log("========================================");
  console.log(`  Message-ID: ${email.messageId}`);
  console.log(`  From:       ${email.from.name || ""} <${email.from.address}>`);
  console.log(`  To:         ${email.to.map((t) => t.address).join(", ")}`);
  console.log(`  Subject:    ${email.subject}`);
  console.log(`  Date:       ${email.date.toISOString()}`);
  console.log(`  Folder:     ${email.folder}`);
  console.log(`  Read:       ${email.isRead}`);
  console.log(`  Starred:    ${email.isStarred}`);
  console.log(`  Size:       ${email.size} bytes`);
  console.log(`  Has Attach: ${email.hasAttachments}`);
  console.log(`  Attach Cnt: ${email.attachments.length}`);

  if (email.snippet) {
    console.log(`  Preview:    ${email.snippet.substring(0, 80)}...`);
  }

  // ========================================
  // YOUR DATABASE INSERT HERE
  // ========================================
  // Example with SQL:
  // const result = await db.query(`
  //   INSERT INTO emails (message_id, subject, from_address, from_name, ...)
  //   VALUES ($1, $2, $3, $4, ...)
  //   RETURNING id
  // `, [email.messageId, email.subject, email.from.address, email.from.name, ...]);
  // return result.rows[0].id;

  // Demo: in-memory store
  const id = emailStore.length + 1;
  emailStore.push({ id, ...email });

  console.log(`  [DB] Saved with ID: ${id}`);
  return id;
}

/**
 * Save an attachment to the database
 * @param {number} emailId - Parent email ID
 * @param {Object} attachment - Attachment object
 * @param {string} attachment.filename - Filename
 * @param {string} attachment.contentType - MIME type
 * @param {number} attachment.size - Size in bytes
 * @param {Buffer} attachment.content - Binary content
 * @param {boolean} attachment.isInline - Is inline attachment
 */
async function saveAttachment(emailId, attachment) {
  console.log(`  [DB] SAVING ATTACHMENT`);
  console.log(`    Email ID:     ${emailId}`);
  console.log(`    Filename:     ${attachment.filename}`);
  console.log(`    Content-Type: ${attachment.contentType}`);
  console.log(`    Size:         ${attachment.size} bytes`);
  console.log(`    Is Inline:    ${attachment.isInline}`);
  console.log(`    Content:      <Buffer ${attachment.content.length} bytes>`);

  // ========================================
  // YOUR DATABASE INSERT HERE
  // ========================================
  // Example with SQL (storing as BLOB):
  // await db.query(`
  //   INSERT INTO attachments (email_id, filename, content_type, size, content, is_inline)
  //   VALUES ($1, $2, $3, $4, $5, $6)
  // `, [emailId, attachment.filename, attachment.contentType, attachment.size, attachment.content, attachment.isInline]);

  // Demo: in-memory store
  const id = attachmentStore.length + 1;
  attachmentStore.push({ id, emailId, ...attachment });

  console.log(`    [DB] Saved attachment with ID: ${id}`);
  return id;
}

/**
 * Check if email already exists in database
 * @param {string} messageId - Email Message-ID header
 * @returns {Promise<boolean>}
 */
async function emailExists(messageId) {
  // ========================================
  // YOUR DATABASE QUERY HERE
  // ========================================
  // Example:
  // const result = await db.query('SELECT 1 FROM emails WHERE message_id = $1', [messageId]);
  // return result.rows.length > 0;

  // Demo: check in-memory
  return emailStore.some((e) => e.messageId === messageId);
}

/**
 * Get all emails (for API)
 */
async function getEmails(limit = 50) {
  // Replace with your DB query
  return emailStore.slice(-limit).reverse();
}

/**
 * Get email by ID
 */
async function getEmailById(id) {
  return emailStore.find((e) => e.id === id);
}

/**
 * Get attachments for an email
 */
async function getAttachmentsByEmailId(emailId) {
  return attachmentStore
    .filter((a) => a.emailId === emailId)
    .map((a) => ({
      id: a.id,
      filename: a.filename,
      contentType: a.contentType,
      size: a.size,
      isInline: a.isInline,
      // Don't include content in list response
    }));
}

/**
 * Get attachment with content (for download)
 */
async function getAttachmentById(id) {
  return attachmentStore.find((a) => a.id === id);
}

module.exports = {
  saveEmail,
  saveAttachment,
  emailExists,
  getEmails,
  getEmailById,
  getAttachmentsByEmailId,
  getAttachmentById,
};
```

---

### `src/routes/emails.js`

Express routes for email API.

```javascript
const express = require("express");
const router = express.Router();
const store = require("../email-store");

/**
 * GET /api/emails
 * List emails
 */
router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const emails = await store.getEmails(limit);

    // Don't send full body/attachments in list
    const emailList = emails.map((e) => ({
      id: e.id,
      messageId: e.messageId,
      from: e.from,
      to: e.to,
      subject: e.subject,
      date: e.date,
      snippet: e.snippet,
      isRead: e.isRead,
      isStarred: e.isStarred,
      hasAttachments: e.hasAttachments,
      attachmentCount: e.attachments?.length || 0,
      folder: e.folder,
    }));

    res.json({ emails: emailList });
  } catch (error) {
    console.error("Error listing emails:", error);
    res.status(500).json({ error: "Failed to list emails" });
  }
});

/**
 * GET /api/emails/:id
 * Get single email with full content
 */
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const email = await store.getEmailById(id);

    if (!email) {
      return res.status(404).json({ error: "Email not found" });
    }

    // Get attachments metadata (without content)
    const attachments = await store.getAttachmentsByEmailId(id);

    res.json({
      ...email,
      attachments, // Replace with metadata only
    });
  } catch (error) {
    console.error("Error getting email:", error);
    res.status(500).json({ error: "Failed to get email" });
  }
});

/**
 * GET /api/emails/:id/attachments
 * List attachments for an email
 */
router.get("/:id/attachments", async (req, res) => {
  try {
    const emailId = parseInt(req.params.id);
    const attachments = await store.getAttachmentsByEmailId(emailId);
    res.json({ attachments });
  } catch (error) {
    console.error("Error listing attachments:", error);
    res.status(500).json({ error: "Failed to list attachments" });
  }
});

/**
 * GET /api/attachments/:id
 * Download attachment
 */
router.get("/attachments/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const attachment = await store.getAttachmentById(id);

    if (!attachment || !attachment.content) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    res.set({
      "Content-Type": attachment.contentType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(attachment.filename)}"`,
      "Content-Length": attachment.content.length,
    });

    res.send(attachment.content);
  } catch (error) {
    console.error("Error downloading attachment:", error);
    res.status(500).json({ error: "Failed to download attachment" });
  }
});

module.exports = router;
```

---

### `index.js`

Main Express server with email client integration.

```javascript
require("dotenv").config();

const express = require("express");
const { createEmailClient } = require("./src/email-client");
const store = require("./src/email-store");
const emailRoutes = require("./src/routes/emails");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// CORS (adjust for production)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Routes
app.use("/api/emails", emailRoutes);

// Global email client instance
let emailClient = null;

/**
 * Initialize and connect email client
 */
async function initEmailClient() {
  emailClient = createEmailClient({
    // Called for each email fetched
    onEmail: async (email) => {
      // Check if already saved
      if (await store.emailExists(email.messageId)) {
        console.log(`[SKIP] Email already exists: ${email.messageId}`);
        return true;
      }

      // Save email to database
      const emailId = await store.saveEmail(email);

      // Save attachments
      for (const attachment of email.attachments) {
        await store.saveAttachment(emailId, attachment);
      }

      return true;
    },

    // Called for each attachment (optional - already handled above)
    // onAttachment: async (attachment, email) => {
    //   console.log(`Attachment: ${attachment.filename}`);
    // },

    // Error handling
    onError: (error, context) => {
      console.error(`[EMAIL ERROR] ${context || "unknown"}:`, error.message);
    },

    // Connection state changes
    onConnectionStateChange: (state) => {
      console.log(`[EMAIL] Connection state: ${state}`);
    },
  });

  await emailClient.connect();
  console.log("[EMAIL] Connected to IMAP server");
}

// ==========================================================================
// API ENDPOINTS FOR EMAIL OPERATIONS
// ==========================================================================

/**
 * POST /api/sync
 * Trigger email sync
 */
app.post("/api/sync", async (req, res) => {
  try {
    if (!emailClient || !emailClient.isConnected()) {
      return res.status(503).json({ error: "Email client not connected" });
    }

    const { limit = 20, folder = "INBOX", since } = req.body;

    const criteria = { limit };
    if (since) {
      criteria.since = new Date(since);
    }

    console.log(`[SYNC] Starting sync: folder=${folder}, limit=${limit}`);
    const emails = await emailClient.fetchEmails(criteria, folder);

    res.json({
      success: true,
      synced: emails.length,
      message: `Synced ${emails.length} emails`,
    });
  } catch (error) {
    console.error("[SYNC] Error:", error);
    res.status(500).json({ error: "Sync failed", details: error.message });
  }
});

/**
 * POST /api/search
 * Search emails via IMAP
 */
app.post("/api/search", async (req, res) => {
  try {
    if (!emailClient || !emailClient.isConnected()) {
      return res.status(503).json({ error: "Email client not connected" });
    }

    const { from, to, subject, since, before, unread, starred, gmailQuery, limit = 20 } = req.body;

    const criteria = {
      from,
      to,
      subject,
      since: since ? new Date(since) : undefined,
      before: before ? new Date(before) : undefined,
      unread,
      starred,
      gmailQuery,
      limit,
    };

    const emails = await emailClient.fetchEmails(criteria);

    res.json({
      success: true,
      count: emails.length,
      emails: emails.map((e) => ({
        id: e.uid,
        messageId: e.messageId,
        from: e.from,
        subject: e.subject,
        date: e.date,
        hasAttachments: e.hasAttachments,
      })),
    });
  } catch (error) {
    console.error("[SEARCH] Error:", error);
    res.status(500).json({ error: "Search failed", details: error.message });
  }
});

/**
 * GET /api/folders
 * List IMAP folders
 */
app.get("/api/folders", async (req, res) => {
  try {
    if (!emailClient || !emailClient.isConnected()) {
      return res.status(503).json({ error: "Email client not connected" });
    }

    const folders = await emailClient.listFolders();
    res.json({ folders });
  } catch (error) {
    console.error("[FOLDERS] Error:", error);
    res.status(500).json({ error: "Failed to list folders" });
  }
});

/**
 * POST /api/monitor/start
 * Start real-time monitoring
 */
app.post("/api/monitor/start", async (req, res) => {
  try {
    if (!emailClient || !emailClient.isConnected()) {
      return res.status(503).json({ error: "Email client not connected" });
    }

    const { folder = "INBOX" } = req.body;
    await emailClient.startMonitoring(folder);

    res.json({ success: true, message: `Monitoring started on ${folder}` });
  } catch (error) {
    console.error("[MONITOR] Error:", error);
    res.status(500).json({ error: "Failed to start monitoring" });
  }
});

/**
 * POST /api/monitor/stop
 * Stop real-time monitoring
 */
app.post("/api/monitor/stop", (req, res) => {
  if (emailClient) {
    emailClient.stopMonitoring();
  }
  res.json({ success: true, message: "Monitoring stopped" });
});

/**
 * GET /api/status
 * Get connection status
 */
app.get("/api/status", (req, res) => {
  res.json({
    connected: emailClient?.isConnected() || false,
    email: process.env.EMAIL_ADDRESS,
    host: process.env.IMAP_HOST,
  });
});

// ==========================================================================
// START SERVER
// ==========================================================================

async function start() {
  try {
    // Initialize email client
    await initEmailClient();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n[SERVER] Running on http://localhost:${PORT}`);
      console.log(`\nAvailable endpoints:`);
      console.log(`  GET  /api/status          - Connection status`);
      console.log(`  GET  /api/folders         - List IMAP folders`);
      console.log(`  POST /api/sync            - Sync emails`);
      console.log(`  POST /api/search          - Search emails`);
      console.log(`  GET  /api/emails          - List stored emails`);
      console.log(`  GET  /api/emails/:id      - Get email details`);
      console.log(`  GET  /api/emails/:id/attachments - List attachments`);
      console.log(`  GET  /api/emails/attachments/:id - Download attachment`);
      console.log(`  POST /api/monitor/start   - Start IDLE monitoring`);
      console.log(`  POST /api/monitor/stop    - Stop monitoring`);
      console.log("");
    });
  } catch (error) {
    console.error("Failed to start:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down...");
  if (emailClient) {
    emailClient.disconnect();
  }
  process.exit(0);
});

start();
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | Connection status |
| GET | `/api/folders` | List IMAP folders |
| POST | `/api/sync` | Sync emails from IMAP |
| POST | `/api/search` | Search emails via IMAP |
| GET | `/api/emails` | List stored emails |
| GET | `/api/emails/:id` | Get email with full content |
| GET | `/api/emails/:id/attachments` | List attachments metadata |
| GET | `/api/emails/attachments/:id` | Download attachment binary |
| POST | `/api/monitor/start` | Start IDLE monitoring |
| POST | `/api/monitor/stop` | Stop monitoring |

### Example API Calls

```bash
# Check status
curl http://localhost:3000/api/status

# Sync last 10 emails
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'

# Search with Gmail query
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"gmailQuery": "has:attachment newer_than:7d", "limit": 5}'

# List stored emails
curl http://localhost:3000/api/emails

# Get email details
curl http://localhost:3000/api/emails/1

# Download attachment
curl http://localhost:3000/api/emails/attachments/1 --output file.pdf

# Start monitoring
curl -X POST http://localhost:3000/api/monitor/start
```

---

## IMAP Concepts

### Search Criteria

| Criteria | Description | Example |
|----------|-------------|---------|
| `from` | From address | `"user@example.com"` |
| `to` | To address | `"me@example.com"` |
| `subject` | Subject contains | `"invoice"` |
| `since` | Emails after date | `new Date("2024-01-01")` |
| `before` | Emails before date | `new Date("2024-12-31")` |
| `unread` | Unread only | `true` |
| `starred` | Starred/flagged | `true` |
| `gmailQuery` | Gmail native syntax | `"has:attachment"` |

### Gmail Search Examples

```javascript
// Gmail native search (X-GM-RAW)
{ gmailQuery: "is:unread" }
{ gmailQuery: "has:attachment" }
{ gmailQuery: "from:boss@company.com is:unread" }
{ gmailQuery: "subject:(invoice OR receipt)" }
{ gmailQuery: "newer_than:7d" }
{ gmailQuery: "larger:5M filename:pdf" }
```

### IMAP Flags

| Flag | Meaning |
|------|---------|
| `\Seen` | Email has been read |
| `\Flagged` | Email is starred |
| `\Answered` | Email has been replied to |
| `\Deleted` | Marked for deletion |
| `\Draft` | Is a draft |

---

## Summary

This provides a complete, standalone Node.js + Express + JavaScript email client:

1. **`src/email-client.js`** - IMAP client with callback-based design
2. **`src/email-store.js`** - Storage adapter (replace console.log with your DB)
3. **`src/routes/emails.js`** - Express routes for email API
4. **`index.js`** - Express server with full integration

**Key features:**
- Pure JavaScript (no TypeScript)
- Express.js server
- Full attachment support with binary content
- Real-time IDLE monitoring
- Gmail search syntax support
- Clean callback interface for your database

Replace the `console.log` statements in `email-store.js` with your actual database calls (PostgreSQL, MySQL, MongoDB, etc.).
