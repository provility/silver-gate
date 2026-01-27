-- Add question_type column to lesson_items table

ALTER TABLE lesson_items
ADD COLUMN IF NOT EXISTS question_type VARCHAR(20) DEFAULT 'OTHER';

-- Add comment to clarify the column
COMMENT ON COLUMN lesson_items.question_type IS 'Type of question: CHOICE_BASED, PROOF_BASED, MULTI_QUESTIONS, OTHER';
