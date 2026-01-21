import { Router } from 'express';
import { googleDriveService } from '../services/googleDrive.service.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

// Get Drive status
router.get('/status', asyncHandler(async (req, res) => {
  const status = googleDriveService.getStatus();
  res.json({ success: true, data: status });
}));

// Create folder
router.post('/folders', asyncHandler(async (req, res) => {
  const { name, parentFolderId } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: 'Folder name is required' });
  }

  const folder = await googleDriveService.createFolder(name, parentFolderId);
  res.status(201).json({ success: true, data: folder });
}));

// Create book/chapter folder structure
router.post('/folders/structure', asyncHandler(async (req, res) => {
  const { bookName, chapterName } = req.body;

  if (!bookName) {
    return res.status(400).json({ success: false, error: 'Book name is required' });
  }

  const structure = await googleDriveService.createBookChapterStructure(bookName, chapterName);
  res.status(201).json({ success: true, data: structure });
}));

// List files in a folder
router.get('/files', asyncHandler(async (req, res) => {
  const { folderId } = req.query;
  const files = await googleDriveService.listFiles(folderId);
  res.json({ success: true, data: files });
}));

// Get file by ID
router.get('/files/:fileId', asyncHandler(async (req, res) => {
  const file = await googleDriveService.getFile(req.params.fileId);
  res.json({ success: true, data: file });
}));

// Upload file
router.post('/files', asyncHandler(async (req, res) => {
  const { fileName, content, mimeType, folderId } = req.body;

  if (!fileName || !content) {
    return res.status(400).json({ success: false, error: 'fileName and content are required' });
  }

  const file = await googleDriveService.uploadFile(
    fileName,
    content,
    mimeType || 'application/octet-stream',
    folderId
  );
  res.status(201).json({ success: true, data: file });
}));

// Delete file or folder
router.delete('/files/:fileId', asyncHandler(async (req, res) => {
  await googleDriveService.deleteFile(req.params.fileId);
  res.json({ success: true, message: 'File deleted successfully' });
}));

export default router;
