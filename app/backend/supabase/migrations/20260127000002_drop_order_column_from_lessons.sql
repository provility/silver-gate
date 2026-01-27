-- Drop the old 'order' column from lessons table (keeping display_order)

ALTER TABLE lessons
DROP COLUMN IF EXISTS "order";
