-- =====================================================
-- OPRET BRUGER MED X GRATIS CREDITS (VERSION 2)
-- =====================================================
-- 
-- DENNE VERSION BRUGER SUPABASE'S ADMIN FUNKTIONER
-- Mere sikker og kompatibel end direkte INSERT
-- 
-- BEMÆRK: Du skal bruge Supabase Dashboard til at oprette brugeren
-- Dette script giver kun credits til eksisterende brugere
-- 
-- =====================================================

-- =====================================================
-- STEP 1: OPRET BRUGEREN I SUPABASE DASHBOARD
-- =====================================================
--
-- Gå til: Authentication -> Users -> "Add user"
-- 
-- Udfyld:
-- - Email: clausp@campaya.com
-- - Password: Ys1%Hd8jB
-- - Auto-confirm user: JA (slå TIL)
--
-- Kopier brugerens UUID efter oprettelse
--
-- =====================================================

-- =====================================================
-- STEP 2: KØR DETTE SCRIPT
-- =====================================================

DO $$
DECLARE
  -- VARIABLER DU SKAL RETTE:
  v_email TEXT := 'clausp@campaya.com';           -- <-- Brugerens email
  v_navn TEXT := 'Claus Pedersen';                -- <-- Brugerens fulde navn
  v_firma TEXT := 'Campaya';                      -- <-- Firmanavn
  v_credits INTEGER := 300;                       -- <-- Antal credits
  
  -- Automatisk genererede variabler:
  v_user_id UUID;
  v_existing_credits INTEGER;
BEGIN
  
  -- =====================================================
  -- TRIN 1: FIND BRUGER
  -- =====================================================
  
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Bruger med email % findes ikke! Opret brugeren først i Supabase Dashboard (Authentication -> Users -> Add user)', v_email;
  END IF;
  
  RAISE NOTICE '✓ Bruger fundet (ID: %)', v_user_id;
  
  -- =====================================================
  -- TRIN 2: OPRET/OPDATER USER PROFILE
  -- =====================================================
  
  -- Check om profil allerede eksisterer
  IF EXISTS (SELECT 1 FROM user_profiles WHERE user_id = v_user_id) THEN
    -- Opdater eksisterende profil
    UPDATE user_profiles 
    SET 
      company_name = v_firma,
      contact_person = v_navn,
      updated_at = NOW()
    WHERE user_id = v_user_id;
    
    RAISE NOTICE '✓ User profile opdateret';
  ELSE
    -- Opret ny profil
    INSERT INTO user_profiles (
      user_id,
      company_name,
      contact_person,
      cvr_number,
      address,
      postal_code,
      city,
      email,
      phone,
      marketing_consent,
      account_type,
      is_active
    )
    VALUES (
      v_user_id,
      v_firma,
      v_navn,
      '',  -- Ingen CVR påkrævet
      '',  -- Ingen adresse påkrævet
      '',
      '',
      v_email,
      '',  -- Intet telefon nummer påkrævet
      false,
      'STANDARD',  -- Standard kunde
      true  -- Aktiv bruger
    );
    
    RAISE NOTICE '✓ User profile oprettet';
  END IF;
  
  -- =====================================================
  -- TRIN 3: TILFØJ CREDITS
  -- =====================================================
  
  -- Check om credit balance allerede eksisterer
  IF EXISTS (SELECT 1 FROM credit_balances WHERE user_id = v_user_id) THEN
    -- Opdater eksisterende balance (tilføj credits)
    SELECT purchased_credits INTO v_existing_credits
    FROM credit_balances
    WHERE user_id = v_user_id;
    
    UPDATE credit_balances
    SET 
      purchased_credits = purchased_credits + v_credits,
      updated_at = NOW()
    WHERE user_id = v_user_id;
    
    RAISE NOTICE '✓ Credits tilføjet (tidligere: %, nye: %, total: %)', 
      v_existing_credits, v_credits, (v_existing_credits + v_credits);
  ELSE
    -- Opret ny credit balance
    INSERT INTO credit_balances (
      user_id,
      subscription_credits,
      purchased_credits
    )
    VALUES (
      v_user_id,
      0,  -- Ingen abonnements credits
      v_credits  -- Livstids credits (purchased)
    );
    
    RAISE NOTICE '✓ Credit balance oprettet (% credits)', v_credits;
  END IF;
  
  -- =====================================================
  -- TRIN 4: LOG CREDIT TRANSAKTION
  -- =====================================================
  
  INSERT INTO credit_transactions (
    user_id,
    amount,
    balance_after,
    credit_type,
    transaction_type,
    description
  )
  VALUES (
    v_user_id,
    v_credits,
    (SELECT total_credits FROM credit_balances WHERE user_id = v_user_id),
    'purchased',
    'purchase',
    'Gratis credits - manuelt tildelt af admin'
  );
  
  RAISE NOTICE '✓ Credit transaktion logget';
  
  -- =====================================================
  -- TRIN 5: SUCCESS MESSAGE
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SUCCESS! Bruger konfigureret';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Email:    %', v_email;
  RAISE NOTICE 'Navn:     %', v_navn;
  RAISE NOTICE 'Firma:    %', v_firma;
  RAISE NOTICE 'Credits:  %', (SELECT total_credits FROM credit_balances WHERE user_id = v_user_id);
  RAISE NOTICE 'User ID:  %', v_user_id;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '👉 Brugeren kan nu logge ind på systemet!';
  RAISE NOTICE '';
  
END $$;


-- =====================================================
-- VERIFICER AT DET VIRKEDE (valgfrit)
-- =====================================================
-- 
-- Udkommenter linjerne nedenfor for at se brugerens data:
-- 
-- SELECT 
--   u.id,
--   u.email,
--   u.created_at as oprettet,
--   u.email_confirmed_at as email_bekræftet,
--   up.company_name as firma,
--   up.contact_person as navn,
--   cb.total_credits as credits,
--   cb.subscription_credits,
--   cb.purchased_credits
-- FROM auth.users u
-- LEFT JOIN user_profiles up ON up.user_id = u.id
-- LEFT JOIN credit_balances cb ON cb.user_id = u.id
-- WHERE u.email = 'clausp@campaya.com'  -- <-- Ret til den email du brugte
-- ORDER BY u.created_at DESC
-- LIMIT 1;






