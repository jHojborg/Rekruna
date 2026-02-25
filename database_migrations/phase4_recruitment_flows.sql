-- =====================================================
-- PHASE 4: Rekrutteringsflow 75 dage
-- 1 stillingsopslag = 1 flow. Max 75 dage fra første CV-screening.
-- =====================================================

CREATE TABLE IF NOT EXISTS recruitment_flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  analysis_id TEXT NOT NULL UNIQUE,
  
  -- Flow timing
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired')),
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_recruitment_flows_user_id ON recruitment_flows(user_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_flows_analysis_id ON recruitment_flows(analysis_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_flows_expires_at ON recruitment_flows(expires_at);

-- RLS
ALTER TABLE recruitment_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own flows"
  ON recruitment_flows FOR SELECT
  USING (auth.uid() = user_id);

-- Service role inserts (API)
CREATE POLICY "Service role can insert flows"
  ON recruitment_flows FOR INSERT
  WITH CHECK (true);

-- Service role updates (for status)
CREATE POLICY "Service role can update flows"
  ON recruitment_flows FOR UPDATE
  USING (true);

SELECT 'Phase 4: recruitment_flows table created' as status;
