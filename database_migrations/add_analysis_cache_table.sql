-- Add cache table for CV analysis results
-- This table stores analysis results keyed by a hash of extracted CV text + requirements
-- to avoid reprocessing identical content with same requirements

CREATE TABLE IF NOT EXISTS analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(64) NOT NULL UNIQUE, -- SHA256 hash of extracted text + requirements
  result_data JSONB NOT NULL, -- Cached analysis result (scores, strengths, concerns, etc)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index for fast cache key lookups
  INDEX idx_analysis_cache_key ON analysis_cache(cache_key),
  
  -- Index for cleanup of old cache entries
  INDEX idx_analysis_cache_created_at ON analysis_cache(created_at)
);

-- Add comment explaining the caching strategy
COMMENT ON TABLE analysis_cache IS 'Caches CV analysis results based on extracted text content and requirements to avoid reprocessing identical CVs';
COMMENT ON COLUMN analysis_cache.cache_key IS 'SHA256 hash of normalized extracted CV text + sorted requirements array';
COMMENT ON COLUMN analysis_cache.result_data IS 'JSON containing overall score, requirement scores, strengths, and concerns (without candidate name)';

-- Optional: Add cleanup function to remove old cache entries (run as scheduled job)
-- DELETE FROM analysis_cache WHERE created_at < NOW() - INTERVAL '24 hours';
