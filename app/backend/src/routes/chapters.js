import { Router } from 'express';
import { chapterService } from '../services/index.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

// Get all chapters (optionally filter by book)
router.get('/', asyncHandler(async (req, res) => {
  const { bookId } = req.query;
  const chapters = await chapterService.getAll(bookId);
  res.json({ success: true, data: chapters });
}));

// Get chapters by book ID
router.get('/book/:bookId', asyncHandler(async (req, res) => {
  const chapters = await chapterService.getByBookId(req.params.bookId);
  res.json({ success: true, data: chapters });
}));

// Get chapter by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const chapter = await chapterService.findById(req.params.id);
  if (!chapter) {
    return res.status(404).json({ success: false, error: 'Chapter not found' });
  }
  res.json({ success: true, data: chapter });
}));

// Create chapter
router.post('/', asyncHandler(async (req, res) => {
  const { name, display_name, book_id, chapter_number, position, source_id } = req.body;

  if (!name || !book_id) {
    return res.status(400).json({ success: false, error: 'Name and book_id are required' });
  }

  const chapter = await chapterService.create({
    name,
    display_name,
    book_id,
    chapter_number,
    position,
    source_id,
  });
  res.status(201).json({ success: true, data: chapter });
}));

// Update chapter
router.put('/:id', asyncHandler(async (req, res) => {
  const { name, display_name, chapter_number, position } = req.body;
  const chapter = await chapterService.update(req.params.id, {
    name,
    display_name,
    chapter_number,
    position,
  });
  res.json({ success: true, data: chapter });
}));

// Delete chapter
router.delete('/:id', asyncHandler(async (req, res) => {
  await chapterService.delete(req.params.id);
  res.json({ success: true, message: 'Chapter deleted successfully' });
}));

export default router;
