-- =====================================================
-- DEMO LEADS TABLE
-- Gemmer demo-signup leads fra marketing kampagner
-- =====================================================

-- Opret demo_leads tabel
CREATE TABLE IF NOT EXISTS demo_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Kontakt information (fra demo-signup formular)
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  phone TEXT NOT NULL, -- Telefonnummer
  email TEXT NOT NULL,
  
  -- Træffes bedst information (fritext felter)
  best_day TEXT, -- Hvornår kan de træffes? (dag)
  best_time TEXT, -- Hvornår kan de træffes? (tidspunkt)
  
  -- Marketing tracking (hvis der er UTM parametre)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT, -- Hvor kom de fra?
  
  -- Status tracking
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'rejected')),
  notes TEXT, -- Admin noter om leadet
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  contacted_at TIMESTAMPTZ -- Hvornår blev de kontaktet?
);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_demo_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_demo_leads_timestamp
  BEFORE UPDATE ON demo_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_demo_leads_updated_at();

-- Indices for hurtig søgning
CREATE INDEX IF NOT EXISTS idx_demo_leads_email 
  ON demo_leads(email);

CREATE INDEX IF NOT EXISTS idx_demo_leads_status 
  ON demo_leads(status);

CREATE INDEX IF NOT EXISTS idx_demo_leads_created 
  ON demo_leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_demo_leads_company 
  ON demo_leads(company_name);

-- Kommentarer til dokumentation
COMMENT ON TABLE demo_leads IS 'Demo signup leads fra marketing kampagner - kontakt oplysninger fra /demo-signup siden';
COMMENT ON COLUMN demo_leads.company_name IS 'Firmanavn fra formular';
COMMENT ON COLUMN demo_leads.contact_name IS 'Kontaktpersons fulde navn';
COMMENT ON COLUMN demo_leads.phone IS 'Telefonnummer';
COMMENT ON COLUMN demo_leads.email IS 'Email adresse';
COMMENT ON COLUMN demo_leads.best_day IS 'Fritext: Hvilken dag kan de bedst træffes?';
COMMENT ON COLUMN demo_leads.best_time IS 'Fritext: Hvilket tidspunkt kan de bedst træffes?';
COMMENT ON COLUMN demo_leads.status IS 'Lead status: new, contacted, qualified, converted, rejected';

-- Row Level Security (RLS)
-- Vi disable public access - kun admin kan se leads via service role
ALTER TABLE demo_leads ENABLE ROW LEVEL SECURITY;

-- Ingen public policies - API bruger service role key
CREATE POLICY "No public access to demo leads"
  ON demo_leads
  FOR ALL
  USING (false);

-- Success message
SELECT 'Demo leads table created successfully!' as status;
SELECT 'Total demo_leads: ' || COUNT(*)::text as count_check 
FROM demo_leads;

