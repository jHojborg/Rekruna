-- Add cache table for CV resume generation
-- This table stores generated resumes keyed by a hash of candidate name + CV text
-- to avoid regenerating identical resumes

CREATE TABLE IF NOT EXISTS resume_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(64) NOT NULL UNIQUE, -- SHA256 hash of candidate name + CV text  
  resume_text TEXT NOT NULL, -- Generated Danish resume (200 words, structured format)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index for fast cache key lookups
  INDEX idx_resume_cache_key ON resume_cache(cache_key),
  
  -- Index for cleanup of old cache entries
  INDEX idx_resume_cache_created_at ON resume_cache(created_at)
);

-- Add comment explaining the resume caching strategy
COMMENT ON TABLE resume_cache IS 'Caches generated CV resumes to avoid regenerating identical content';
COMMENT ON COLUMN resume_cache.cache_key IS 'SHA256 hash of normalized candidate name + CV text content';
COMMENT ON COLUMN resume_cache.resume_text IS 'Generated Danish resume text (structured, 200 words)';

-- Optional: Add cleanup function to remove old cache entries (run as scheduled job)
-- DELETE FROM resume_cache WHERE created_at < NOW() - INTERVAL '24 hours';
