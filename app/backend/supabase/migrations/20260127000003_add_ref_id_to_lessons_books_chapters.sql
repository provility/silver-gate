-- Migration: Add ref_id column to lessons, books, and chapters tables for MongoDB sync
-- Created at: 2026-01-27

-- Add ref_id column to lessons table (24-character hex string for MongoDB ObjectId compatibility)
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS ref_id VARCHAR(24);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lessons_ref_id ON lessons(ref_id) WHERE ref_id IS NOT NULL;

-- Add ref_id column to books table
ALTER TABLE books
ADD COLUMN IF NOT EXISTS ref_id VARCHAR(24);

CREATE UNIQUE INDEX IF NOT EXISTS idx_books_ref_id ON books(ref_id) WHERE ref_id IS NOT NULL;

-- Add ref_id column to chapters table
ALTER TABLE chapters
ADD COLUMN IF NOT EXISTS ref_id VARCHAR(24);

CREATE UNIQUE INDEX IF NOT EXISTS idx_chapters_ref_id ON chapters(ref_id) WHERE ref_id IS NOT NULL;
