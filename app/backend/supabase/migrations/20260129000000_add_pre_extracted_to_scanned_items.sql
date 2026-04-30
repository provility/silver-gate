-- Add pre_extracted column to scanned_items table.
-- Stores the LaTeX content with explicit <<<Q_START>>>...<<<Q_END>>> markers
-- around each question. Populated by the pre-extraction API and consumed
-- by the question extraction flow when present.

ALTER TABLE scanned_items
ADD COLUMN IF NOT EXISTS pre_extracted TEXT;

-- Generated boolean indicator so list views can show pre-extraction state
-- without fetching the full TEXT payload.
ALTER TABLE scanned_items
ADD COLUMN IF NOT EXISTS pre_extracted_present BOOLEAN
GENERATED ALWAYS AS (pre_extracted IS NOT NULL) STORED;
