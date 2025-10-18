-- =====================================================
-- CACHE TABLES FOR PERFORMANCE OPTIMIZATION
-- These tables cache OpenAI results to avoid redundant API calls
-- Run this in Supabase SQL Editor to remove cache warnings
-- =====================================================

-- 1. Analysis Cache Table
-- Caches complete analysis results based on CV content + requirements
CREATE TABLE IF NOT EXISTS analysis_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT UNIQUE NOT NULL,
  result_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_analysis_cache_key 
  ON analysis_cache(cache_key);

CREATE INDEX IF NOT EXISTS idx_analysis_cache_created 
  ON analysis_cache(created_at);

COMMENT ON TABLE analysis_cache IS 'Caches OpenAI analysis results to avoid redundant API calls';
COMMENT ON COLUMN analysis_cache.cache_key IS 'SHA256 hash of CV text + requirements + job text';
COMMENT ON COLUMN analysis_cache.result_data IS 'Complete analysis result (scores, strengths, concerns)';

-- =====================================================
-- 2. Resume Cache Table
-- Caches generated CV resumes
CREATE TABLE IF NOT EXISTS resume_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT UNIQUE NOT NULL,
  resume_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_resume_cache_key 
  ON resume_cache(cache_key);

CREATE INDEX IF NOT EXISTS idx_resume_cache_created 
  ON resume_cache(created_at);

COMMENT ON TABLE resume_cache IS 'Caches generated CV resumes';
COMMENT ON COLUMN resume_cache.cache_key IS 'SHA256 hash of candidate name + CV text';
COMMENT ON COLUMN resume_cache.resume_text IS 'Generated resume text (200 words)';

-- =====================================================
-- 3. CV Text Cache Table
-- Temporarily stores extracted CV text for on-demand resume generation
CREATE TABLE IF NOT EXISTS cv_text_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text_hash TEXT UNIQUE NOT NULL,
  cv_text TEXT NOT NULL,
  candidate_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Indexes for fast lookups and cleanup
CREATE INDEX IF NOT EXISTS idx_cv_text_cache_hash 
  ON cv_text_cache(text_hash);

CREATE INDEX IF NOT EXISTS idx_cv_text_cache_expires 
  ON cv_text_cache(expires_at);

COMMENT ON TABLE cv_text_cache IS 'Temporarily stores CV text for on-demand resume generation (expires after 2 hours)';
COMMENT ON COLUMN cv_text_cache.text_hash IS 'SHA256 hash of CV text';
COMMENT ON COLUMN cv_text_cache.expires_at IS 'When this cache entry expires (auto-cleanup)';

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check that all tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('analysis_cache', 'resume_cache', 'cv_text_cache')
ORDER BY table_name;

-- Check indexes
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE tablename IN ('analysis_cache', 'resume_cache', 'cv_text_cache')
ORDER BY tablename, indexname;

-- =====================================================
-- DONE! 
-- Cache warnings should now be gone when running CV analysis
-- =====================================================





