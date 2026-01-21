import { google } from 'googleapis';
import { Readable } from 'stream';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

// Initialize Google Drive API
let driveClient = null;

function getAuthClient() {
  if (!config.googleDrive.clientEmail || !config.googleDrive.privateKey) {
    return null;
  }

  const auth = new google.auth.JWT({
    email: config.googleDrive.clientEmail,
    key: config.googleDrive.privateKey,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return auth;
}

function getDriveClient() {
  if (!driveClient) {
    const auth = getAuthClient();
    if (!auth) {
      logger.warn('DRIVE', 'Google Drive credentials not configured');
      return null;
    }
    driveClient = google.drive({ version: 'v3', auth });
  }
  return driveClient;
}

export const googleDriveService = {
  /**
   * Check if Google Drive is configured
   */
  isConfigured() {
    return !!(config.googleDrive.clientEmail && config.googleDrive.privateKey);
  },

  /**
   * Create a folder in Google Drive
   * @param {string} folderName - Name of the folder
   * @param {string} parentFolderId - Parent folder ID (optional, uses root if not provided)
   * @returns {Promise<{id: string, name: string, webViewLink: string}>}
   */
  async createFolder(folderName, parentFolderId = null) {
    const drive = getDriveClient();
    if (!drive) {
      throw new Error('Google Drive not configured');
    }

    logger.info('DRIVE', `Creating folder: ${folderName}`);

    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId || config.googleDrive.rootFolderId].filter(Boolean),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id, name, webViewLink',
    });

    logger.success('DRIVE', `Folder created: ${response.data.name} (${response.data.id})`);

    return {
      id: response.data.id,
      name: response.data.name,
      webViewLink: response.data.webViewLink,
    };
  },

  /**
   * Upload a file to Google Drive
   * @param {string} fileName - Name of the file
   * @param {Buffer|string} content - File content (Buffer or base64 string)
   * @param {string} mimeType - MIME type of the file
   * @param {string} folderId - Destination folder ID (optional)
   * @returns {Promise<{id: string, name: string, webViewLink: string}>}
   */
  async uploadFile(fileName, content, mimeType, folderId = null) {
    const drive = getDriveClient();
    if (!drive) {
      throw new Error('Google Drive not configured');
    }

    logger.info('DRIVE', `Uploading file: ${fileName}`);

    // Convert content to stream
    let buffer = content;
    if (typeof content === 'string') {
      buffer = Buffer.from(content, 'base64');
    }
    const stream = Readable.from(buffer);

    const fileMetadata = {
      name: fileName,
      parents: [folderId || config.googleDrive.rootFolderId].filter(Boolean),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: mimeType,
        body: stream,
      },
      fields: 'id, name, webViewLink',
    });

    logger.success('DRIVE', `File uploaded: ${response.data.name} (${response.data.id})`);

    return {
      id: response.data.id,
      name: response.data.name,
      webViewLink: response.data.webViewLink,
    };
  },

  /**
   * List files in a folder
   * @param {string} folderId - Folder ID to list (optional, uses root if not provided)
   * @returns {Promise<Array<{id: string, name: string, mimeType: string}>>}
   */
  async listFiles(folderId = null) {
    const drive = getDriveClient();
    if (!drive) {
      throw new Error('Google Drive not configured');
    }

    const parentId = folderId || config.googleDrive.rootFolderId;
    const query = parentId ? `'${parentId}' in parents and trashed = false` : 'trashed = false';

    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name, mimeType, webViewLink, createdTime)',
      orderBy: 'name',
    });

    return response.data.files || [];
  },

  /**
   * Get file metadata
   * @param {string} fileId - File ID
   * @returns {Promise<{id: string, name: string, mimeType: string, webViewLink: string}>}
   */
  async getFile(fileId) {
    const drive = getDriveClient();
    if (!drive) {
      throw new Error('Google Drive not configured');
    }

    const response = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, webViewLink, createdTime',
    });

    return response.data;
  },

  /**
   * Delete a file or folder
   * @param {string} fileId - File or folder ID
   */
  async deleteFile(fileId) {
    const drive = getDriveClient();
    if (!drive) {
      throw new Error('Google Drive not configured');
    }

    logger.info('DRIVE', `Deleting file: ${fileId}`);

    await drive.files.delete({ fileId });

    logger.success('DRIVE', `File deleted: ${fileId}`);
  },

  /**
   * Create folder structure for a book/chapter
   * @param {string} bookName - Book name
   * @param {string} chapterName - Chapter name (optional)
   * @returns {Promise<{bookFolderId: string, chapterFolderId?: string}>}
   */
  async createBookChapterStructure(bookName, chapterName = null) {
    const drive = getDriveClient();
    if (!drive) {
      throw new Error('Google Drive not configured');
    }

    logger.info('DRIVE', `Creating structure: ${bookName}${chapterName ? '/' + chapterName : ''}`);

    // Create book folder
    const bookFolder = await this.createFolder(bookName, config.googleDrive.rootFolderId);

    if (!chapterName) {
      return { bookFolderId: bookFolder.id };
    }

    // Create chapter folder inside book
    const chapterFolder = await this.createFolder(chapterName, bookFolder.id);

    return {
      bookFolderId: bookFolder.id,
      chapterFolderId: chapterFolder.id,
    };
  },

  /**
   * Get status of Google Drive configuration
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      rootFolderId: config.googleDrive.rootFolderId || null,
      serviceAccount: config.googleDrive.clientEmail || null,
    };
  },
};

export default googleDriveService;
