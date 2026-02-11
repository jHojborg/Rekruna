-- =====================================================
-- FIX: SLET OG GENOPRET BRUGER KORREKT
-- =====================================================
-- 
-- Dette script:
-- 1. Sletter fejlagtig bruger (hvis den findes)
-- 2. Opretter brugeren korrekt med ALLE nødvendige felter
-- 3. Tilføjer credits
-- 
-- Brug dette script hvis login ikke virker
-- 
-- =====================================================

-- =====================================================
-- VARIABLER (RET DISSE!)
-- =====================================================

DO $$
DECLARE
  -- VARIABLER DU SKAL RETTE:
  v_email TEXT := 'clausp@campaya.com';           -- <-- Brugerens email
  v_navn TEXT := 'Claus Pedersen';                -- <-- Brugerens fulde navn
  v_firma TEXT := 'Campaya';                      -- <-- Firmanavn
  v_password TEXT := 'Ys1%Hd8jB';                 -- <-- Password (min. 6 tegn)
  v_credits INTEGER := 300;                       -- <-- Antal credits
  
  -- Automatisk genererede variabler:
  v_user_id UUID;
  v_password_hash TEXT;
  v_instance_id UUID;
BEGIN
  
  -- =====================================================
  -- TRIN 1: SLET EKSISTERENDE BRUGER (hvis findes)
  -- =====================================================
  
  -- Slet alt relateret til denne email
  DELETE FROM credit_transactions WHERE user_id IN (SELECT id FROM auth.users WHERE email = v_email);
  DELETE FROM credit_balances WHERE user_id IN (SELECT id FROM auth.users WHERE email = v_email);
  DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM auth.users WHERE email = v_email);
  DELETE FROM auth.users WHERE email = v_email;
  
  RAISE NOTICE '✓ Gammel bruger slettet (hvis den fandtes)';
  
  -- =====================================================
  -- TRIN 2: VALIDER INPUT
  -- =====================================================
  
  IF v_email = '' OR v_email IS NULL THEN
    RAISE EXCEPTION 'Email må ikke være tom';
  END IF;
  
  IF LENGTH(v_password) < 6 THEN
    RAISE EXCEPTION 'Password skal være mindst 6 tegn';
  END IF;
  
  IF v_credits <= 0 THEN
    RAISE EXCEPTION 'Credits skal være et positivt tal';
  END IF;
  
  RAISE NOTICE '✓ Input valideret';
  
  -- =====================================================
  -- TRIN 3: OPRET AUTH USER (med ALLE felter)
  -- =====================================================
  
  -- Generer IDs
  v_user_id := gen_random_uuid();
  
  -- Hent instance_id fra eksisterende bruger (hvis der er nogen)
  SELECT instance_id INTO v_instance_id 
  FROM auth.users 
  LIMIT 1;
  
  -- Hvis ingen brugere findes, brug default
  IF v_instance_id IS NULL THEN
    v_instance_id := '00000000-0000-0000-0000-000000000000';
  END IF;
  
  -- Hash password med bcrypt
  v_password_hash := crypt(v_password, gen_salt('bf'));
  
  -- Indsæt bruger med ALLE nødvendige felter
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    created_at,
    updated_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    aud,
    role
  )
  VALUES (
    v_user_id,
    v_instance_id,
    v_email,
    v_password_hash,
    NOW(),  -- Email auto-bekræftet
    '',     -- Ingen confirmation token (allerede bekræftet)
    '',     -- Ingen recovery token
    '',     -- Ingen email change token
    '',     -- Ingen email change
    NOW(),
    NOW(),
    NULL,   -- Har ikke logget ind endnu
    jsonb_build_object(
      'provider', 'email',
      'providers', jsonb_build_array('email')
    ),
    jsonb_build_object(
      'name', v_navn,
      'company_name', v_firma
    ),
    false,  -- Ikke super admin
    'authenticated',
    'authenticated'
  );
  
  RAISE NOTICE '✓ Auth bruger oprettet (ID: %)', v_user_id;
  
  -- =====================================================
  -- TRIN 4: OPRET USER PROFILE
  -- =====================================================
  
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
    '',
    '',
    '',
    '',
    v_email,
    '',
    false,
    'STANDARD',
    true
  );
  
  RAISE NOTICE '✓ User profile oprettet';
  
  -- =====================================================
  -- TRIN 5: OPRET CREDIT BALANCE
  -- =====================================================
  
  INSERT INTO credit_balances (
    user_id,
    subscription_credits,
    purchased_credits
  )
  VALUES (
    v_user_id,
    0,
    v_credits
  );
  
  RAISE NOTICE '✓ Credit balance oprettet (% credits)', v_credits;
  
  -- =====================================================
  -- TRIN 6: LOG CREDIT TRANSAKTION
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
    v_credits,
    'purchased',
    'purchase',
    'Gratis credits - manuelt oprettet af admin'
  );
  
  RAISE NOTICE '✓ Credit transaktion logget';
  
  -- =====================================================
  -- TRIN 7: SUCCESS MESSAGE
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SUCCESS! Bruger oprettet korrekt';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Email:    %', v_email;
  RAISE NOTICE 'Password: %', v_password;
  RAISE NOTICE 'Navn:     %', v_navn;
  RAISE NOTICE 'Firma:    %', v_firma;
  RAISE NOTICE 'Credits:  %', v_credits;
  RAISE NOTICE 'User ID:  %', v_user_id;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '👉 Brugeren kan nu logge ind!';
  RAISE NOTICE '   Prøv at logge ind på: https://rekruna.dk/login';
  RAISE NOTICE '';
  
END $$;






