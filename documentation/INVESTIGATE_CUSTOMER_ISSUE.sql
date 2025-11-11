-- =====================================================
-- INVESTIGATE CUSTOMER: c.rysgaard@tbauctions.com
-- Check if customer went through flow without payment
-- =====================================================

-- 1. Find user_id from email
SELECT 
  id as user_id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'c.rysgaard@tbauctions.com';

-- Copy the user_id from above and use it in queries below
-- Replace 'USER_ID_HERE' with actual UUID

-- 2. Check if they have a Stripe customer record
SELECT 
  id,
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  product_tier,
  status,
  monthly_credit_allocation,
  created_at
FROM user_subscriptions
WHERE user_id = 'USER_ID_HERE';

-- 3. Check their credit balance
SELECT 
  subscription_credits,
  purchased_credits,
  total_credits,
  last_subscription_reset,
  created_at,
  updated_at
FROM credit_balances
WHERE user_id = 'USER_ID_HERE';

-- 4. Check all credit transactions (should show if credits were added)
SELECT 
  id,
  amount,
  balance_after,
  credit_type,
  transaction_type,
  stripe_payment_intent_id,
  description,
  created_at
FROM credit_transactions
WHERE user_id = 'USER_ID_HERE'
ORDER BY created_at DESC;

-- 5. Check if they have a user profile
SELECT 
  company_name,
  contact_person,
  cvr_number,
  email,
  marketing_consent,
  created_at
FROM user_profiles
WHERE user_id = 'USER_ID_HERE';

-- =====================================================
-- WHAT TO LOOK FOR:
-- =====================================================
-- 
-- SCENARIO 1: Payment Status Not Checked (MOST LIKELY)
-- - user_subscriptions exists with stripe_customer_id
-- - credit_balances shows credits > 0
-- - credit_transactions shows credits added
-- - BUT no stripe_payment_intent_id (or failed payment)
-- → Fix: Already applied! Payment status check now added
--
-- SCENARIO 2: Test Mode
-- - stripe_customer_id starts with "cus_test_"
-- - Used test credit card
-- → Fix: Check Stripe dashboard mode (test vs live)
--
-- SCENARIO 3: Webhook Failed
-- - user_subscriptions exists
-- - NO credit_balances record (or 0 credits)
-- - NO credit_transactions
-- → Fix: Manually trigger webhook or add credits
--
-- SCENARIO 4: Account Created But Flow Incomplete
-- - auth.users record exists
-- - NO user_subscriptions record
-- - NO credit_balances record
-- → This is normal - user abandoned signup
-- =====================================================

-- =====================================================
-- IF CREDITS WERE WRONGLY ADDED (No Payment):
-- You can manually remove them:
-- =====================================================

-- Remove credits (replace USER_ID_HERE)
/*
UPDATE credit_balances
SET 
  subscription_credits = 0,
  purchased_credits = 0
WHERE user_id = 'USER_ID_HERE';

-- Set subscription to incomplete
UPDATE user_subscriptions
SET status = 'incomplete'
WHERE user_id = 'USER_ID_HERE';

-- Add audit transaction
INSERT INTO credit_transactions (
  user_id,
  amount,
  balance_after,
  credit_type,
  transaction_type,
  description
) VALUES (
  'USER_ID_HERE',
  -200,  -- Adjust to actual amount removed
  0,
  'subscription',
  'refund',
  'Credits removed - payment not confirmed'
);
*/









