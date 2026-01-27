-- Add parent_section_name column to lessons table
-- This allows per-lesson parent section name override (for manual range configuration)

ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS parent_section_name VARCHAR(255);

-- Add comment to clarify the difference between common_parent_section_name and parent_section_name
COMMENT ON COLUMN lessons.common_parent_section_name IS 'Shared parent section name applied to all lessons created in a batch (Auto Split mode)';
COMMENT ON COLUMN lessons.parent_section_name IS 'Per-lesson parent section name override (Manual Range mode)';
