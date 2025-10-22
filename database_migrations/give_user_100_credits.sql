-- =====================================================
-- GIV BRUGER 100 GRATIS CREDITS
-- =====================================================
-- 
-- SÅDAN BRUGER DU DETTE SCRIPT:
-- 1. Find brugeren i Supabase: Authentication -> Users
-- 2. Kopier brugerens UUID (user_id)
-- 3. Indsæt UUID'en nedenfor hvor der står 'INDSÆT-USER-ID-HER'
-- 4. Kør hele scriptet i Supabase SQL Editor
-- 5. DONE! Brugeren har nu 100 credits
-- 
-- =====================================================

-- INDSÆT BRUGERENS ID HER (mellem citationstegnene):
DO $$
DECLARE
  v_user_id UUID := 'INDSÆT-USER-ID-HER';  -- <-- INDSÆT USER ID HER
  v_credits_to_give INTEGER := 100;
BEGIN
  
  -- Giv brugeren 100 livstids credits
  -- Hvis brugeren ikke har en credit_balance record, oprettes den automatisk
  -- Hvis brugeren allerede har credits, lægges 100 credits til
  
  INSERT INTO credit_balances (
    user_id, 
    subscription_credits, 
    purchased_credits
  )
  VALUES (
    v_user_id, 
    0,  -- Ingen abonnements credits
    v_credits_to_give  -- 100 livstids credits
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    purchased_credits = credit_balances.purchased_credits + v_credits_to_give,
    updated_at = NOW();
  
  -- Log transaktionen for audit trail
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
    v_credits_to_give,  -- Positivt tal = tilføjet
    (SELECT total_credits FROM credit_balances WHERE user_id = v_user_id),
    'purchased',
    'purchase',
    'Gratis test credits - givet manuelt af admin'
  );
  
  -- Vis resultat
  RAISE NOTICE 'SUCCESS! Brugeren har nu % credits', 
    (SELECT total_credits FROM credit_balances WHERE user_id = v_user_id);
    
END $$;

-- Verificer at det virkede:
-- Se brugerens nye balance (udkommenter linjen nedenfor hvis du vil se resultatet)
-- SELECT 
--   u.email,
--   cb.subscription_credits,
--   cb.purchased_credits,
--   cb.total_credits
-- FROM credit_balances cb
-- JOIN auth.users u ON u.id = cb.user_id
-- WHERE cb.user_id = 'INDSÆT-SAMME-USER-ID-HER';


