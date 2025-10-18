-- Job Templates Table
-- Allows users to save job descriptions and requirements for reuse

CREATE TABLE IF NOT EXISTS job_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Template info
  title TEXT NOT NULL,
  description TEXT,
  
  -- Job data
  job_file_name TEXT, -- Original filename
  job_file_url TEXT, -- Stored in Supabase Storage (optional - for reference)
  
  -- Requirements (as JSON array)
  requirements JSONB NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Stats
  usage_count INTEGER DEFAULT 0
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_job_templates_user_id ON job_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_job_templates_created_at ON job_templates(created_at DESC);

-- RLS Policies
ALTER TABLE job_templates ENABLE ROW LEVEL SECURITY;

-- Users can only see their own templates
CREATE POLICY "Users can view own templates" ON job_templates
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own templates
CREATE POLICY "Users can create own templates" ON job_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own templates
CREATE POLICY "Users can update own templates" ON job_templates
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own templates
CREATE POLICY "Users can delete own templates" ON job_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_job_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_job_templates_updated_at_trigger
  BEFORE UPDATE ON job_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_job_templates_updated_at();

-- Sample data comment
COMMENT ON TABLE job_templates IS 'Stores reusable job templates with requirements for repeated analyses';
COMMENT ON COLUMN job_templates.requirements IS 'JSON array of requirement objects with id, text, and selected fields';



