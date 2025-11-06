-- =====================================================
-- EVENT SIGNUP SYSTEM - DATABASE SCHEMA
-- Tilføjer pending signups og EVENT kunde funktionalitet
-- =====================================================

-- =====================================================
-- 1. PENDING EVENT SIGNUPS TABLE
-- Gemmer signup anmodninger før admin godkendelse
-- =====================================================

CREATE TABLE IF NOT EXISTS pending_event_signups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Kontakt information (fra signup formular)
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  phone TEXT NOT NULL CHECK (phone ~ '^\d{8}$'), -- Præcis 8 cifre
  email TEXT NOT NULL UNIQUE,
  
  -- Password (krypteret af bcrypt på server side)
  password_hash TEXT NOT NULL,
  
  -- Kampagne tracking
  campaign_source TEXT, -- Fx "linkedin-demo-jan-2025"
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Admin noter og status
  notes TEXT, -- Til admin noter om hvorfor godkendt/afvist
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT -- Admin email/navn
);

-- Indices for hurtig søgning
CREATE INDEX IF NOT EXISTS idx_pending_event_signups_email 
  ON pending_event_signups(email);

CREATE INDEX IF NOT EXISTS idx_pending_event_signups_status 
  ON pending_event_signups(status) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_pending_event_signups_created 
  ON pending_event_signups(created_at DESC);

-- Kommentarer
COMMENT ON TABLE pending_event_signups IS 'Pending EVENT signup anmodninger der afventer admin godkendelse';
COMMENT ON COLUMN pending_event_signups.password_hash IS 'Bcrypt hashed password - bruges ved godkendelse til at oprette Supabase user';
COMMENT ON COLUMN pending_event_signups.campaign_source IS 'Marketing kampagne kilde for tracking og kontrol (fx max antal per kampagne)';

-- =====================================================
-- 2. OPDATER USER_PROFILES TABEL
-- Tilføj EVENT kunde felter
-- =====================================================

-- Tilføj account_type kolonne (STANDARD eller EVENT)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'account_type'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN account_type TEXT DEFAULT 'STANDARD' NOT NULL 
    CHECK (account_type IN ('STANDARD', 'EVENT'));
  END IF;
END $$;

-- Tilføj event_signup_date kolonne
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'event_signup_date'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN event_signup_date TIMESTAMPTZ;
  END IF;
END $$;

-- Tilføj event_expiry_date kolonne (signup_date + 14 dage)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'event_expiry_date'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN event_expiry_date TIMESTAMPTZ;
  END IF;
END $$;

-- Tilføj is_active kolonne (brugt til at deaktivere udløbne EVENT konti)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;
  END IF;
END $$;

-- Index for hurtig EVENT kunde lookup
CREATE INDEX IF NOT EXISTS idx_user_profiles_account_type 
  ON user_profiles(account_type);

CREATE INDEX IF NOT EXISTS idx_user_profiles_event_expiry 
  ON user_profiles(event_expiry_date) 
  WHERE account_type = 'EVENT' AND is_active = true;

-- Kommentarer
COMMENT ON COLUMN user_profiles.account_type IS 'STANDARD = normal betalende kunde, EVENT = demo/trial kunde';
COMMENT ON COLUMN user_profiles.event_signup_date IS 'Dato for EVENT signup (kun for EVENT kunder)';
COMMENT ON COLUMN user_profiles.event_expiry_date IS 'Udløbsdato for EVENT konto (signup_date + 14 dage)';
COMMENT ON COLUMN user_profiles.is_active IS 'Om kontoen er aktiv - sættes til false når EVENT konto udløber';

-- =====================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS på pending_event_signups
ALTER TABLE pending_event_signups ENABLE ROW LEVEL SECURITY;

-- Admin kan se alle pending signups (vi laver admin role check senere)
-- For nu: Ingen public access
CREATE POLICY "Only authenticated admin can view pending signups"
  ON pending_event_signups
  FOR SELECT
  USING (false); -- Disable for now, admin endpoints vil bruge service role

CREATE POLICY "No public insert on pending signups"
  ON pending_event_signups
  FOR INSERT
  WITH CHECK (false); -- API endpoint bruger service role

-- =====================================================
-- 4. HELPER FUNCTION - Auto-beregn expiry date
-- =====================================================

CREATE OR REPLACE FUNCTION set_event_expiry_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Hvis account_type er EVENT og event_signup_date er sat
  IF NEW.account_type = 'EVENT' AND NEW.event_signup_date IS NOT NULL THEN
    -- Sæt expiry til 14 dage efter signup
    NEW.event_expiry_date := NEW.event_signup_date + INTERVAL '14 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger der auto-sætter expiry date
DROP TRIGGER IF EXISTS trigger_set_event_expiry_date ON user_profiles;
CREATE TRIGGER trigger_set_event_expiry_date
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_event_expiry_date();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'EVENT signup system tables created successfully!' as status;
SELECT 'pending_event_signups: ' || COUNT(*)::text || ' rows' as pending_table_check 
FROM pending_event_signups;
SELECT 'user_profiles with EVENT support: Ready' as user_profiles_check;

