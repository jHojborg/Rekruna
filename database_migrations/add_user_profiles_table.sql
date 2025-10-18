-- =====================================================
-- USER PROFILES TABLE
-- Stores business information for invoicing and marketing
-- =====================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Company information
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  cvr_number TEXT NOT NULL,
  
  -- Address
  address TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  
  -- Contact (kan være forskellig fra auth email)
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Marketing consent
  marketing_consent BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id 
  ON user_profiles(user_id);

-- Index for email lookups (marketing campaigns)
CREATE INDEX IF NOT EXISTS idx_user_profiles_email 
  ON user_profiles(email);

-- Index for marketing consent filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_marketing 
  ON user_profiles(marketing_consent) 
  WHERE marketing_consent = true;

-- Comments
COMMENT ON TABLE user_profiles IS 'Stores business and contact information for users (for invoicing and marketing)';
COMMENT ON COLUMN user_profiles.email IS 'Business email for invoices and marketing (can differ from auth email)';
COMMENT ON COLUMN user_profiles.marketing_consent IS 'User consent for receiving marketing emails';

-- Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can create own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_profiles_timestamp
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Success message
SELECT 'User profiles table created successfully!' as status;

