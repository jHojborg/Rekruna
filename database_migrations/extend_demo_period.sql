-- =====================================================
-- FORLÆNG DEMO PERIODE MED X DAGE
-- =====================================================
-- 
-- SÅDAN BRUGER DU DETTE SCRIPT:
-- 1. Find brugeren i Supabase: Authentication -> Users
-- 2. Kopier brugerens UUID (user_id)
-- 3. Indsæt UUID'en nedenfor hvor der står 'INDSÆT-USER-ID-HER'
-- 4. Sæt antal dage du vil forlænge med (v_days_to_add)
-- 5. Kør hele scriptet i Supabase SQL Editor
-- 6. DONE! Demo perioden er forlænget
-- 
-- LOGIK:
-- - Hvis demo allerede er udløbet: Sætter ny udløbsdato til i dag + X dage
-- - Hvis demo stadig er aktiv: Lægger X dage til den eksisterende udløbsdato
-- - Sætter is_active = true (reaktiverer hvis cron har deaktiveret kontoen)
-- 
-- =====================================================

DO $$
DECLARE
  -- VARIABLER DU SKAL RETTE:
  v_user_id UUID := 'INDSÆT-USER-ID-HER';  -- <-- Indsæt brugerens UUID
  v_days_to_add INTEGER := 14;             -- <-- Antal dage at forlænge med (fx 7, 14, 30)
  
  -- Interne variabler (rør dem ikke):
  v_profile_exists BOOLEAN;
  v_is_event_account BOOLEAN;
  v_current_expiry TIMESTAMPTZ;
  v_new_expiry TIMESTAMPTZ;
BEGIN
  
  -- Tjek at brugeren har en user_profile
  SELECT EXISTS(SELECT 1 FROM user_profiles WHERE user_id = v_user_id) INTO v_profile_exists;
  IF NOT v_profile_exists THEN
    RAISE EXCEPTION 'Brugeren findes ikke i user_profiles. Opret profil først.';
  END IF;
  
  -- Tjek at brugeren er EVENT konto (demo konto)
  SELECT 
    account_type = 'EVENT',
    event_expiry_date
  INTO v_is_event_account, v_current_expiry
  FROM user_profiles 
  WHERE user_id = v_user_id;
  
  IF NOT v_is_event_account THEN
    RAISE EXCEPTION 'Brugeren er ikke en EVENT/demo konto (account_type = %). Scriptet virker kun for demo konti.', 
      (SELECT account_type FROM user_profiles WHERE user_id = v_user_id);
  END IF;
  
  -- Beregn ny udløbsdato:
  -- Hvis allerede udløbet (expiry < nu): sæt til i dag + X dage
  -- Hvis stadig aktiv: læg X dage til eksisterende udløbsdato
  IF v_current_expiry IS NULL OR v_current_expiry < NOW() THEN
    v_new_expiry := NOW() + (v_days_to_add || ' days')::INTERVAL;
  ELSE
    v_new_expiry := v_current_expiry + (v_days_to_add || ' days')::INTERVAL;
  END IF;
  
  -- Opdater user_profiles: forlæng expiry og reaktiver konto
  UPDATE user_profiles
  SET 
    event_expiry_date = v_new_expiry,
    is_active = true,  -- Reaktiver hvis cron har deaktiveret
    updated_at = NOW()
  WHERE user_id = v_user_id;
  
  -- Vis resultat
  RAISE NOTICE 'SUCCESS! Demo perioden er forlænget med % dage.', v_days_to_add;
  RAISE NOTICE 'Ny udløbsdato: %', v_new_expiry;
    
END $$;

-- Verificer at det virkede (udkommenter for at se resultat):
-- SELECT 
--   up.user_id,
--   up.account_type,
--   up.event_expiry_date,
--   up.is_active,
--   u.email
-- FROM user_profiles up
-- JOIN auth.users u ON u.id = up.user_id
-- WHERE up.user_id = 'INDSÆT-SAMME-USER-ID-HER';
