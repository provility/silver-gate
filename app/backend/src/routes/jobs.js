import { Router } from 'express';
import { jobService } from '../services/index.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

// Get active job
router.get('/active', asyncHandler(async (req, res) => {
  const job = await jobService.getActiveJob();
  res.json({ success: true, data: job });
}));

// Get all jobs
router.get('/', asyncHandler(async (req, res) => {
  const jobs = await jobService.getAll();
  res.json({ success: true, data: jobs });
}));

// Set active job (book, chapter, and item_type)
router.post('/active', asyncHandler(async (req, res) => {
  const { book_id, chapter_id, item_type } = req.body;

  if (!book_id || !chapter_id) {
    return res.status(400).json({
      success: false,
      error: 'Both book_id and chapter_id are required',
    });
  }

  // Validate item_type if provided
  if (item_type && !['question', 'solution'].includes(item_type)) {
    return res.status(400).json({
      success: false,
      error: 'item_type must be either "question" or "solution"',
    });
  }

  const job = await jobService.setActiveJob(book_id, chapter_id, item_type || 'question');
  res.json({ success: true, data: job });
}));

// Update active job
router.put('/active', asyncHandler(async (req, res) => {
  const { book_id, chapter_id, item_type } = req.body;

  if (!book_id || !chapter_id) {
    return res.status(400).json({
      success: false,
      error: 'Both book_id and chapter_id are required',
    });
  }

  // Validate item_type if provided
  if (item_type && !['question', 'solution'].includes(item_type)) {
    return res.status(400).json({
      success: false,
      error: 'item_type must be either "question" or "solution"',
    });
  }

  const job = await jobService.setActiveJob(book_id, chapter_id, item_type || 'question');
  res.json({ success: true, data: job });
}));

export default router;
