-- =====================================================
-- OPRET BRUGER MED X GRATIS CREDITS
-- =====================================================
-- 
-- SÅDAN BRUGER DU DETTE SCRIPT:
-- 1. Ret de 5 variabler nedenfor (email, navn, firma, password, credits)
-- 2. Kør hele scriptet i Supabase SQL Editor
-- 3. DONE! Brugeren er oprettet og kan logge ind
-- 
-- BEMÆRK: 
-- - Brugeren oprettes direkte i systemet (intet betaling påkrævet)
-- - Credits er "purchased" = livstids credits (udløber ikke)
-- - Password skal være mindst 6 tegn
-- 
-- =====================================================

-- =====================================================
-- TRIN 1: INDSTIL VARIABLER (RET DISSE!)
-- =====================================================

DO $$
DECLARE
  -- VARIABLER DU SKAL RETTE:
  v_email TEXT := 'test@example.com';           -- <-- Brugerens email
  v_navn TEXT := 'Test Bruger';                 -- <-- Brugerens fulde navn
  v_firma TEXT := 'Test Firma ApS';             -- <-- Firmanavn
  v_password TEXT := 'testpass123';             -- <-- Password (min. 6 tegn)
  v_credits INTEGER := 100;                     -- <-- Antal credits
  
  -- Automatisk genererede variabler (rør dem ikke):
  v_user_id UUID;
  v_password_hash TEXT;
  v_temp_password TEXT;
BEGIN
  
  -- =====================================================
  -- TRIN 2: VALIDER INPUT
  -- =====================================================
  
  -- Check at email er udfyldt
  IF v_email = '' OR v_email IS NULL THEN
    RAISE EXCEPTION 'Email må ikke være tom';
  END IF;
  
  -- Check at email ikke allerede eksisterer
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    RAISE EXCEPTION 'Email % eksisterer allerede i systemet', v_email;
  END IF;
  
  -- Check at password er langt nok
  IF LENGTH(v_password) < 6 THEN
    RAISE EXCEPTION 'Password skal være mindst 6 tegn';
  END IF;
  
  -- Check at credits er positivt tal
  IF v_credits <= 0 THEN
    RAISE EXCEPTION 'Credits skal være et positivt tal';
  END IF;
  
  RAISE NOTICE '✓ Input valideret - starter oprettelse...';
  
  -- =====================================================
  -- TRIN 3: OPRET AUTH USER
  -- =====================================================
  
  -- Generer bruger ID (UUID)
  v_user_id := gen_random_uuid();
  
  -- Hash password med bcrypt
  v_password_hash := crypt(v_password, gen_salt('bf'));
  
  -- Indsæt bruger i auth.users tabellen
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
  )
  VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    v_email,
    v_password_hash,
    NOW(),  -- Email auto-bekræftet
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('name', v_navn, 'company_name', v_firma),
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
    '',  -- Ingen CVR påkrævet
    '',  -- Ingen adresse påkrævet
    '',
    '',
    v_email,
    '',  -- Intet telefon nummer påkrævet
    false,
    'STANDARD',  -- Standard kunde (kan købe credits og betale)
    true  -- Aktiv bruger
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
    0,  -- Ingen abonnements credits
    v_credits  -- Livstids credits (purchased)
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
  RAISE NOTICE '✅ SUCCESS! Bruger oprettet';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Email:    %', v_email;
  RAISE NOTICE 'Password: %', v_password;
  RAISE NOTICE 'Navn:     %', v_navn;
  RAISE NOTICE 'Firma:    %', v_firma;
  RAISE NOTICE 'Credits:  %', v_credits;
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
--   up.company_name as firma,
--   up.contact_person as navn,
--   cb.total_credits as credits
-- FROM auth.users u
-- LEFT JOIN user_profiles up ON up.user_id = u.id
-- LEFT JOIN credit_balances cb ON cb.user_id = u.id
-- WHERE u.email = 'test@example.com'  -- <-- Ret til den email du brugte
-- ORDER BY u.created_at DESC
-- LIMIT 1;

