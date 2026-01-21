import { Router } from 'express';
import { bookService } from '../services/index.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

// Get all books
router.get('/', asyncHandler(async (req, res) => {
  const books = await bookService.getAll();
  res.json({ success: true, data: books });
}));

// Get book by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const book = await bookService.findById(req.params.id);
  if (!book) {
    return res.status(404).json({ success: false, error: 'Book not found' });
  }
  res.json({ success: true, data: book });
}));

// Create book
router.post('/', asyncHandler(async (req, res) => {
  const { name, display_name, description, source_id } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: 'Name is required' });
  }

  const book = await bookService.create({ name, display_name, description, source_id });
  res.status(201).json({ success: true, data: book });
}));

// Update book
router.put('/:id', asyncHandler(async (req, res) => {
  const { name, display_name, description } = req.body;
  const book = await bookService.update(req.params.id, { name, display_name, description });
  res.json({ success: true, data: book });
}));

// Delete book
router.delete('/:id', asyncHandler(async (req, res) => {
  await bookService.delete(req.params.id);
  res.json({ success: true, message: 'Book deleted successfully' });
}));

export default router;
