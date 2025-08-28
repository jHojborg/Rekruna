-- Add temporary cache table for CV text storage for resume generation
-- This table stores extracted CV text temporarily to enable on-demand resume generation
-- while maintaining GDPR compliance by auto-expiring entries

CREATE TABLE IF NOT EXISTS cv_text_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA256 hash of the CV text content
  cv_text TEXT NOT NULL, -- Extracted and processed CV text content
  candidate_name VARCHAR(255) NOT NULL, -- Candidate name for reference
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL, -- Auto-expiry time (typically 2 hours)
  
  -- Index for fast hash lookups
  INDEX idx_cv_text_cache_hash ON cv_text_cache(text_hash),
  
  -- Index for cleanup of expired entries
  INDEX idx_cv_text_cache_expires_at ON cv_text_cache(expires_at)
);

-- Add comments explaining the temporary caching strategy
COMMENT ON TABLE cv_text_cache IS 'Temporary cache for CV text content to enable on-demand resume generation while maintaining GDPR compliance';
COMMENT ON COLUMN cv_text_cache.text_hash IS 'SHA256 hash of the extracted CV text content for unique identification';
COMMENT ON COLUMN cv_text_cache.cv_text IS 'Extracted and job-relevant CV text content used for resume generation';
COMMENT ON COLUMN cv_text_cache.candidate_name IS 'Candidate name for reference and debugging';
COMMENT ON COLUMN cv_text_cache.expires_at IS 'Automatic expiry time - entries older than this are considered invalid';

-- Setup automatic cleanup of expired entries (run as scheduled job)
-- This can be run periodically to maintain GDPR compliance
-- DELETE FROM cv_text_cache WHERE expires_at < NOW();
