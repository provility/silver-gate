-- Add question_range and display_order columns to lessons table

ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS question_range VARCHAR(50);

ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Add comment to clarify the columns
COMMENT ON COLUMN lessons.question_range IS 'Range of questions covered by this lesson (e.g., "1 - 10", "11 - 20")';
COMMENT ON COLUMN lessons.display_order IS 'Order of the lesson within its chapter (auto-incremented per chapter)';

-- Create an index for faster ordering queries
CREATE INDEX IF NOT EXISTS idx_lessons_chapter_display_order ON lessons(chapter_id, display_order);
