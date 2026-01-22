-- Migration: Add solution_sets table
-- Created at: 2026-01-22

CREATE TABLE IF NOT EXISTS solution_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    book_id UUID REFERENCES books(id) ON DELETE SET NULL,
    chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
    source_item_ids UUID[] NOT NULL,
    question_set_id UUID REFERENCES question_sets(id) ON DELETE SET NULL,
    solutions JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    llamaparse_job_id VARCHAR(255),
    total_solutions INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_solution_sets_book_id ON solution_sets(book_id);
CREATE INDEX IF NOT EXISTS idx_solution_sets_chapter_id ON solution_sets(chapter_id);
CREATE INDEX IF NOT EXISTS idx_solution_sets_question_set_id ON solution_sets(question_set_id);
CREATE INDEX IF NOT EXISTS idx_solution_sets_status ON solution_sets(status);
CREATE INDEX IF NOT EXISTS idx_solution_sets_created_at ON solution_sets(created_at DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_solution_sets_updated_at ON solution_sets;
CREATE TRIGGER update_solution_sets_updated_at
    BEFORE UPDATE ON solution_sets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
