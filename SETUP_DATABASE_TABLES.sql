-- ==============================================
-- STEP 2: Create Database Tables for Resume Feature
-- ==============================================
-- Copy and paste this entire file into your Supabase SQL Editor
-- Or run each CREATE TABLE statement separately

-- 1. Resume Cache Table
-- This stores generated resumes to avoid regenerating them
CREATE TABLE IF NOT EXISTS resume_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(64) NOT NULL UNIQUE, -- SHA256 hash of candidate name + CV text
  resume_text TEXT NOT NULL, -- Generated Danish resume (200 words, structured format)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_resume_cache_key ON resume_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_resume_cache_created_at ON resume_cache(created_at);

-- Table comments
COMMENT ON TABLE resume_cache IS 'Caches generated CV resumes to avoid regenerating identical content';
COMMENT ON COLUMN resume_cache.cache_key IS 'SHA256 hash of normalized candidate name + CV text content';
COMMENT ON COLUMN resume_cache.resume_text IS 'Generated Danish resume text (structured, 200 words)';

-- 2. CV Text Cache Table  
-- This temporarily stores CV text for resume generation (GDPR compliant with expiry)
CREATE TABLE IF NOT EXISTS cv_text_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA256 hash of the CV text content
  cv_text TEXT NOT NULL, -- Extracted and processed CV text content
  candidate_name VARCHAR(255) NOT NULL, -- Candidate name for reference
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL -- Auto-expiry time (typically 2 hours)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cv_text_cache_hash ON cv_text_cache(text_hash);
CREATE INDEX IF NOT EXISTS idx_cv_text_cache_expires_at ON cv_text_cache(expires_at);

-- Table comments
COMMENT ON TABLE cv_text_cache IS 'Temporary cache for CV text content to enable on-demand resume generation while maintaining GDPR compliance';
COMMENT ON COLUMN cv_text_cache.text_hash IS 'SHA256 hash of the extracted CV text content for unique identification';
COMMENT ON COLUMN cv_text_cache.cv_text IS 'Extracted and job-relevant CV text content used for resume generation';
COMMENT ON COLUMN cv_text_cache.candidate_name IS 'Candidate name for reference and debugging';
COMMENT ON COLUMN cv_text_cache.expires_at IS 'Automatic expiry time - entries older than this are considered invalid';

-- Success message
SELECT 'Resume feature database tables created successfully!' as status;
