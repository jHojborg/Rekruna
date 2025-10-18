-- =====================================================
-- CREDIT SYSTEM - MANUAL TEST SCRIPTS
-- Run these AFTER creating the tables
-- Replace 'YOUR_USER_ID_HERE' with actual user ID from auth.users
-- =====================================================

-- =====================================================
-- STEP 1: Get a valid user ID from your auth.users table
-- =====================================================

-- List all users (pick one user_id to use for testing)
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Copy one user ID and use it in the tests below
-- Example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

-- =====================================================
-- STEP 2: Initialize credit balance for test user
-- =====================================================

-- Replace YOUR_USER_ID_HERE with actual user ID
INSERT INTO credit_balances (user_id, subscription_credits, purchased_credits)
VALUES (5c29101c-b27e-4d6b-b695-cd879fe75aa9, 400, 100)
ON CONFLICT (user_id) 
DO UPDATE SET 
  subscription_credits = 400,
  purchased_credits = 100;

-- Verify it was created
SELECT 
  user_id,
  subscription_credits,
  purchased_credits,
  total_credits, -- Should be 500
  created_at,
  updated_at
FROM credit_balances 
WHERE user_id = 5c29101c-b27e-4d6b-b695-cd879fe75aa9;

-- Expected result:
-- subscription_credits: 400
-- purchased_credits: 100
-- total_credits: 500

-- =====================================================
-- STEP 3: Test adding credits (purchase simulation)
-- =====================================================

-- Simulate user buying 200 credits (Pay as you go)
INSERT INTO credit_transactions (
  user_id,
  amount,
  balance_after,
  credit_type,
  transaction_type,
  stripe_payment_intent_id,
  description
)
VALUES (
  5c29101c-b27e-4d6b-b695-cd879fe75aa9,
  200, -- Adding 200 credits
  300, -- 100 existing + 200 new = 300 purchased
  'purchased',
  'purchase',
  'pi_test_123456789', -- Fake Stripe payment ID
  'Purchased Pay as you go package (200 credits)'
);

-- Update the balance
UPDATE credit_balances 
SET purchased_credits = purchased_credits + 200
WHERE user_id = 5c29101c-b27e-4d6b-b695-cd879fe75aa9;

-- Verify balance updated
SELECT 
  subscription_credits, -- Should still be 400
  purchased_credits, -- Should be 300 (100 + 200)
  total_credits -- Should be 700 (400 + 300)
FROM credit_balances 
WHERE user_id = 5c29101c-b27e-4d6b-b695-cd879fe75aa9;

-- Verify transaction was logged
SELECT 
  transaction_type,
  credit_type,
  amount,
  balance_after,
  description,
  created_at
FROM credit_transactions 
WHERE user_id = 5c29101c-b27e-4d6b-b695-cd879fe75aa9
ORDER BY created_at DESC;

-- =====================================================
-- STEP 4: Test deducting credits (analysis simulation)
-- =====================================================

-- Simulate analyzing 50 CVs
-- Remember: Deduct from subscription_credits FIRST

-- Log the deduction transaction
INSERT INTO credit_transactions (
  user_id,
  amount,
  balance_after,
  credit_type,
  transaction_type,
  analysis_id,
  description
)
VALUES (
  5c29101c-b27e-4d6b-b695-cd879fe75aa9,
  -50, -- Deducting 50 credits
  650, -- 700 - 50 = 650 total
  'subscription', -- Using subscription credits first
  'deduction',
  'analysis_test_001', -- Fake analysis ID
  'Analyzed 50 CVs'
);

-- Update the balance (deduct from subscription first)
UPDATE credit_balances 
SET subscription_credits = subscription_credits - 50
WHERE user_id = 5c29101c-b27e-4d6b-b695-cd879fe75aa9;

-- Verify balance updated correctly
SELECT 
  subscription_credits, -- Should be 350 (400 - 50)
  purchased_credits, -- Should still be 300
  total_credits -- Should be 650 (350 + 300)
FROM credit_balances 
WHERE user_id = 5c29101c-b27e-4d6b-b695-cd879fe75aa9;

-- =====================================================
-- STEP 5: Test deduction priority (subscription first, then purchased)
-- =====================================================

-- Simulate analyzing 400 CVs (more than subscription_credits)
-- Should use all 350 subscription + 50 from purchased

-- Transaction 1: Deduct all remaining subscription credits
INSERT INTO credit_transactions (
  user_id,
  amount,
  balance_after,
  credit_type,
  transaction_type,
  analysis_id,
  description
)
VALUES (
  5c29101c-b27e-4d6b-b695-cd879fe75aa9,
  -350, -- All remaining subscription credits
  300, -- 650 - 350 = 300
  'subscription',
  'deduction',
  'analysis_test_002',
  'Analyzed 400 CVs - Part 1 (subscription credits)'
);

-- Transaction 2: Deduct remaining from purchased credits
INSERT INTO credit_transactions (
  user_id,
  amount,
  balance_after,
  credit_type,
  transaction_type,
  analysis_id,
  description
)
VALUES (
  5c29101c-b27e-4d6b-b695-cd879fe75aa9,
  -50, -- Remaining 50 from purchased
  250, -- 300 - 50 = 250
  'purchased',
  'deduction',
  'analysis_test_002',
  'Analyzed 400 CVs - Part 2 (purchased credits)'
);

-- Update the balance
UPDATE credit_balances 
SET 
  subscription_credits = 0, -- All used
  purchased_credits = purchased_credits - 50 -- 300 - 50 = 250
WHERE user_id = 5c29101c-b27e-4d6b-b695-cd879fe75aa9;

-- Verify final balance
SELECT 
  subscription_credits, -- Should be 0
  purchased_credits, -- Should be 250
  total_credits -- Should be 250
FROM credit_balances 
WHERE user_id = 5c29101c-b27e-4d6b-b695-cd879fe75aa9;

-- =====================================================
-- STEP 6: Test refund (analysis failed)
-- =====================================================

-- Simulate refunding the last analysis (50 credits from purchased)
INSERT INTO credit_transactions (
  user_id,
  amount,
  balance_after,
  credit_type,
  transaction_type,
  analysis_id,
  description
)
VALUES (
  5c29101c-b27e-4d6b-b695-cd879fe75aa9,
  50, -- Refunding 50 credits
  300, -- 250 + 50 = 300
  'purchased', -- Refund to the same type we deducted from
  'refund',
  'analysis_test_002',
  'Refund: Analysis failed due to OpenAI API error'
);

-- Update the balance
UPDATE credit_balances 
SET purchased_credits = purchased_credits + 50
WHERE user_id = 5c29101c-b27e-4d6b-b695-cd879fe75aa9;

-- Verify refund worked
SELECT 
  subscription_credits, -- Should still be 0
  purchased_credits, -- Should be 300 (250 + 50)
  total_credits -- Should be 300
FROM credit_balances 
WHERE user_id = 5c29101c-b27e-4d6b-b695-cd879fe75aa9;

-- =====================================================
-- STEP 7: Test subscription reset (monthly renewal)
-- =====================================================

-- Simulate monthly subscription renewal (Pro plan = 400 credits)
INSERT INTO credit_transactions (
  user_id,
  amount,
  balance_after,
  credit_type,
  transaction_type,
  description
)
VALUES (
  5c29101c-b27e-4d6b-b695-cd879fe75aa9,
  400, -- New allocation
  700, -- 300 purchased + 400 new subscription = 700
  'subscription',
  'subscription_reset',
  'Monthly Pro subscription renewal (400 credits)'
);

-- Reset subscription credits (this overwrites, not adds)
UPDATE credit_balances 
SET 
  subscription_credits = 400, -- Reset to 400 (not add)
  last_subscription_reset = NOW()
WHERE user_id = 5c29101c-b27e-4d6b-b695-cd879fe75aa9;

-- Verify subscription reset
SELECT 
  subscription_credits, -- Should be 400 (reset, not added)
  purchased_credits, -- Should still be 300 (unchanged)
  total_credits, -- Should be 700
  last_subscription_reset -- Should be NOW
FROM credit_balances 
WHERE user_id = 5c29101c-b27e-4d6b-b695-cd879fe75aa9;

-- =====================================================
-- STEP 8: View complete transaction history
-- =====================================================

-- See all transactions for this user
SELECT 
  transaction_type,
  credit_type,
  amount,
  balance_after,
  analysis_id,
  stripe_payment_intent_id,
  description,
  created_at
FROM credit_transactions 
WHERE user_id = 5c29101c-b27e-4d6b-b695-cd879fe75aa9
ORDER BY created_at ASC;

-- Expected to see:
-- 1. purchase (+200, purchased)
-- 2. deduction (-50, subscription) for analysis_test_001
-- 3. deduction (-350, subscription) for analysis_test_002 part 1
-- 4. deduction (-50, purchased) for analysis_test_002 part 2
-- 5. refund (+50, purchased) for analysis_test_002
-- 6. subscription_reset (+400, subscription)

-- =====================================================
-- STEP 9: Test subscription creation
-- =====================================================

-- Create a test subscription (Pro plan)
INSERT INTO user_subscriptions (
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  product_tier,
  monthly_credit_allocation,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end
)
VALUES (
  5c29101c-b27e-4d6b-b695-cd879fe75aa9,
  'cus_test_123456789', -- Fake Stripe customer ID
  'sub_test_123456789', -- Fake Stripe subscription ID
  'price_test_pro', -- Fake Stripe price ID
  'pro',
  400,
  'active',
  NOW(),
  NOW() + INTERVAL '1 month',
  false
);

-- Verify subscription was created
SELECT 
  stripe_customer_id,
  product_tier,
  monthly_credit_allocation,
  status,
  current_period_end,
  cancel_at_period_end
FROM user_subscriptions 
WHERE user_id = 5c29101c-b27e-4d6b-b695-cd879fe75aa9;

-- =====================================================
-- STEP 10: Clean up test data (optional)
-- =====================================================

-- If you want to start fresh, uncomment and run:

-- DELETE FROM credit_transactions WHERE user_id = 'YOUR_USER_ID_HERE';
-- DELETE FROM user_subscriptions WHERE user_id = 'YOUR_USER_ID_HERE';
-- DELETE FROM credit_balances WHERE user_id = 'YOUR_USER_ID_HERE';

-- =====================================================
-- SUMMARY OF EXPECTED RESULTS
-- =====================================================

-- After running all tests, you should have:
-- 
-- credit_balances:
-- - subscription_credits: 400
-- - purchased_credits: 300
-- - total_credits: 700
--
-- credit_transactions: 6 rows
-- - 1 purchase
-- - 3 deductions
-- - 1 refund
-- - 1 subscription_reset
--
-- user_subscriptions: 1 row
-- - tier: pro
-- - status: active
-- - monthly_credit_allocation: 400

-- =====================================================
-- ALL TESTS COMPLETE! ✓
-- =====================================================


