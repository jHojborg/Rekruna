-- =====================================================
-- ANALYSIS RESULTS TABLE
-- Stores completed CV analysis history
-- (Should already exist, but this ensures it's created)
-- =====================================================

CREATE TABLE IF NOT EXISTS analysis_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  analysis_id UUID NOT NULL, -- Session ID for grouping multiple CVs
  
  -- Analysis details
  name TEXT NOT NULL, -- Candidate name
  title TEXT, -- Job title analyzed
  overall DECIMAL(3,1) CHECK (overall >= 0 AND overall <= 10), -- Overall score
  
  -- Detailed results
  scores JSONB, -- Requirement scores array
  strengths JSONB, -- Candidate strengths
  concerns JSONB, -- Candidate concerns
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_analysis_results_user_id 
  ON analysis_results(user_id);

CREATE INDEX IF NOT EXISTS idx_analysis_results_analysis_id 
  ON analysis_results(analysis_id);

CREATE INDEX IF NOT EXISTS idx_analysis_results_created_at 
  ON analysis_results(created_at DESC);

-- Composite index for user's recent analyses
CREATE INDEX IF NOT EXISTS idx_analysis_results_user_created 
  ON analysis_results(user_id, created_at DESC);

-- Comments
COMMENT ON TABLE analysis_results IS 'Stores completed CV analysis results for history/reporting';
COMMENT ON COLUMN analysis_results.analysis_id IS 'Groups multiple CVs analyzed in the same session';
COMMENT ON COLUMN analysis_results.title IS 'Job title that CVs were analyzed against';

-- Row Level Security (RLS)
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- Users can only see their own analyses
CREATE POLICY "Users can view own analyses"
  ON analysis_results
  FOR SELECT
  USING (auth.uid() = user_id);

-- Server can insert analyses (via service role)
CREATE POLICY "Service role can insert analyses"
  ON analysis_results
  FOR INSERT
  WITH CHECK (true); -- Service role bypasses this anyway

-- Success message
SELECT 'Analysis results table ensured!' as status;



