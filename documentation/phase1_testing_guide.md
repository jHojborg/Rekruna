# Phase 1 - Manual Testing Guide

## Overview
This guide walks you through testing the credit system database tables **before** we build the Credits Service.

## Prerequisites
- ✅ Supabase project is set up
- ✅ You have access to Supabase SQL Editor
- ✅ Database tables have been created (using `add_credit_system_complete.sql`)

---

## Step 1: Run the Database Schema

1. Open Supabase Dashboard → SQL Editor
2. Open the file: `/database_migrations/add_credit_system_complete.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click **"Run"**

### Expected Output:
You should see at the bottom:
```
✓ 3 tables created (credit_balances, credit_transactions, user_subscriptions)
✓ 7 indexes created
✓ RLS enabled on all 3 tables
```

### Verification Queries:
The SQL file includes verification queries at the end. You should see:

**Table Check:**
| table_name | column_count |
|------------|--------------|
| credit_balances | 7 |
| credit_transactions | 11 |
| user_subscriptions | 13 |

**RLS Check:**
| tablename | rls_enabled |
|-----------|-------------|
| credit_balances | true |
| credit_transactions | true |
| user_subscriptions | true |

---

## Step 2: Get a Test User ID

Open a new SQL Editor tab and run:

```sql
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
```

**Copy one user ID** - you'll need it for all tests below.  
Example: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

---

## Step 3: Run Test Scripts

### Option A: Use the Complete Test File (Recommended)

1. Open `/database_migrations/test_credit_system.sql`
2. **Find and Replace** all instances of `'YOUR_USER_ID_HERE'` with your actual user ID
3. Run sections one at a time (Steps 2-9)
4. Check results after each step

### Option B: Manual Step-by-Step Testing

Follow the sections below to test each feature individually.

---

## Test Scenarios

### Test 1: Initialize Credit Balance

**What we're testing:** Creating a credit balance for a user

**SQL:**
```sql
INSERT INTO credit_balances (user_id, subscription_credits, purchased_credits)
VALUES ('YOUR_USER_ID', 400, 100);

SELECT * FROM credit_balances WHERE user_id = 'YOUR_USER_ID';
```

**Expected Result:**
- subscription_credits: `400`
- purchased_credits: `100`
- total_credits: `500` ← Should auto-calculate
- created_at and updated_at should be set

**✓ Success Criteria:** Total credits = 500 (auto-computed)

---

### Test 2: Add Credits (Purchase)

**What we're testing:** User buys 200 credits (Pay as you go package)

**SQL:**
```sql
-- Log the transaction
INSERT INTO credit_transactions (
  user_id, amount, balance_after, credit_type, 
  transaction_type, description
) VALUES (
  'YOUR_USER_ID', 200, 300, 'purchased', 
  'purchase', 'Purchased Pay as you go (200 credits)'
);

-- Update balance
UPDATE credit_balances 
SET purchased_credits = purchased_credits + 200
WHERE user_id = 'YOUR_USER_ID';

-- Check result
SELECT * FROM credit_balances WHERE user_id = 'YOUR_USER_ID';
```

**Expected Result:**
- subscription_credits: `400` (unchanged)
- purchased_credits: `300` (100 + 200)
- total_credits: `700`

**✓ Success Criteria:** Transaction logged + balance updated correctly

---

### Test 3: Deduct Credits (Analysis)

**What we're testing:** User analyzes 50 CVs (deduct from subscription first)

**SQL:**
```sql
-- Log the deduction
INSERT INTO credit_transactions (
  user_id, amount, balance_after, credit_type, 
  transaction_type, analysis_id, description
) VALUES (
  'YOUR_USER_ID', -50, 650, 'subscription', 
  'deduction', 'analysis_001', 'Analyzed 50 CVs'
);

-- Update balance
UPDATE credit_balances 
SET subscription_credits = subscription_credits - 50
WHERE user_id = 'YOUR_USER_ID';

-- Check result
SELECT * FROM credit_balances WHERE user_id = 'YOUR_USER_ID';
```

**Expected Result:**
- subscription_credits: `350` (400 - 50)
- purchased_credits: `300` (unchanged)
- total_credits: `650`

**✓ Success Criteria:** Subscription credits deducted first (priority rule)

---

### Test 4: Deduction Priority (Complex)

**What we're testing:** Deduct MORE than subscription credits available

User has:
- 350 subscription credits
- 300 purchased credits
- Wants to analyze 400 CVs

Should deduct:
- 350 from subscription (all of it)
- 50 from purchased (remaining)

**SQL:**
```sql
-- Part 1: Deduct all subscription credits
INSERT INTO credit_transactions (
  user_id, amount, balance_after, credit_type, 
  transaction_type, analysis_id, description
) VALUES (
  'YOUR_USER_ID', -350, 300, 'subscription', 
  'deduction', 'analysis_002', 'Analyzed 400 CVs - subscription part'
);

-- Part 2: Deduct remaining from purchased
INSERT INTO credit_transactions (
  user_id, amount, balance_after, credit_type, 
  transaction_type, analysis_id, description
) VALUES (
  'YOUR_USER_ID', -50, 250, 'purchased', 
  'deduction', 'analysis_002', 'Analyzed 400 CVs - purchased part'
);

-- Update balance
UPDATE credit_balances 
SET 
  subscription_credits = 0,
  purchased_credits = purchased_credits - 50
WHERE user_id = 'YOUR_USER_ID';

-- Check result
SELECT * FROM credit_balances WHERE user_id = 'YOUR_USER_ID';
```

**Expected Result:**
- subscription_credits: `0` (all used)
- purchased_credits: `250` (300 - 50)
- total_credits: `250`

**✓ Success Criteria:** Two transactions logged with same analysis_id

---

### Test 5: Refund Credits

**What we're testing:** Analysis failed, refund the credits

**SQL:**
```sql
-- Log the refund
INSERT INTO credit_transactions (
  user_id, amount, balance_after, credit_type, 
  transaction_type, analysis_id, description
) VALUES (
  'YOUR_USER_ID', 50, 300, 'purchased', 
  'refund', 'analysis_002', 'Refund: Analysis failed'
);

-- Update balance
UPDATE credit_balances 
SET purchased_credits = purchased_credits + 50
WHERE user_id = 'YOUR_USER_ID';

-- Check result
SELECT * FROM credit_balances WHERE user_id = 'YOUR_USER_ID';
```

**Expected Result:**
- subscription_credits: `0` (unchanged)
- purchased_credits: `300` (250 + 50 refunded)
- total_credits: `300`

**✓ Success Criteria:** Credits restored + transaction logged

---

### Test 6: Monthly Subscription Reset

**What we're testing:** Pro plan renews (400 credits reset, not added)

**SQL:**
```sql
-- Log the reset
INSERT INTO credit_transactions (
  user_id, amount, balance_after, credit_type, 
  transaction_type, description
) VALUES (
  'YOUR_USER_ID', 400, 700, 'subscription', 
  'subscription_reset', 'Monthly Pro renewal'
);

-- Reset (not add) subscription credits
UPDATE credit_balances 
SET 
  subscription_credits = 400,
  last_subscription_reset = NOW()
WHERE user_id = 'YOUR_USER_ID';

-- Check result
SELECT * FROM credit_balances WHERE user_id = 'YOUR_USER_ID';
```

**Expected Result:**
- subscription_credits: `400` (reset to 400, not 0 + 400)
- purchased_credits: `300` (unchanged - lifetime credits)
- total_credits: `700`
- last_subscription_reset: (current timestamp)

**✓ Success Criteria:** Subscription credits RESET (not added), purchased unchanged

---

### Test 7: Create Subscription Record

**What we're testing:** Link user to a Stripe subscription

**SQL:**
```sql
INSERT INTO user_subscriptions (
  user_id, stripe_customer_id, stripe_subscription_id,
  stripe_price_id, product_tier, monthly_credit_allocation,
  status, current_period_start, current_period_end
) VALUES (
  'YOUR_USER_ID', 'cus_test_123', 'sub_test_123',
  'price_test_pro', 'pro', 400,
  'active', NOW(), NOW() + INTERVAL '1 month'
);

-- Check result
SELECT * FROM user_subscriptions WHERE user_id = 'YOUR_USER_ID';
```

**Expected Result:**
- product_tier: `pro`
- monthly_credit_allocation: `400`
- status: `active`
- current_period_end: (1 month from now)

**✓ Success Criteria:** Subscription created with proper foreign key link

---

### Test 8: View Transaction History

**What we're testing:** Audit trail completeness

**SQL:**
```sql
SELECT 
  transaction_type,
  credit_type,
  amount,
  balance_after,
  analysis_id,
  description,
  created_at
FROM credit_transactions 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at ASC;
```

**Expected Result:**
You should see 6 transactions in chronological order:
1. `purchase` +200 (purchased)
2. `deduction` -50 (subscription) - analysis_001
3. `deduction` -350 (subscription) - analysis_002
4. `deduction` -50 (purchased) - analysis_002
5. `refund` +50 (purchased) - analysis_002
6. `subscription_reset` +400 (subscription)

**✓ Success Criteria:** Complete audit trail of all credit movements

---

### Test 9: RLS Policy Verification

**What we're testing:** Users can only see their own data

**How to test:**
1. Log into your app as the test user
2. Try to query credit_balances from the browser/client
3. Should only see their own row

**SQL (from client-side Supabase):**
```typescript
const { data, error } = await supabase
  .from('credit_balances')
  .select('*')

// Should return only 1 row (their own balance)
// Should NOT see other users' balances
```

**✓ Success Criteria:** RLS prevents viewing other users' data

---

## Final Verification Checklist

After completing all tests, verify:

- [ ] ✅ credit_balances table has 1 row for your test user
- [ ] ✅ Total credits = 700 (400 subscription + 300 purchased)
- [ ] ✅ credit_transactions table has 6 rows
- [ ] ✅ user_subscriptions table has 1 row
- [ ] ✅ All timestamps are populated
- [ ] ✅ Computed column (total_credits) updates automatically
- [ ] ✅ RLS policies prevent cross-user data access
- [ ] ✅ Foreign key constraints work (user_id → auth.users)

---

## Clean Up (Optional)

If you want to reset and test again:

```sql
DELETE FROM credit_transactions WHERE user_id = 'YOUR_USER_ID';
DELETE FROM user_subscriptions WHERE user_id = 'YOUR_USER_ID';
DELETE FROM credit_balances WHERE user_id = 'YOUR_USER_ID';
```

---

## Troubleshooting

### Error: "relation credit_balances does not exist"
→ Run the `add_credit_system_complete.sql` file first

### Error: "violates foreign key constraint"
→ Make sure the user_id exists in `auth.users` table

### Total credits don't auto-calculate
→ The `GENERATED ALWAYS AS` column might need a database restart (rare)

### RLS blocking your queries
→ Make sure you're authenticated as the correct user when testing

---

## Next Steps

Once all tests pass:
✅ **Phase 1 Complete!**  
➡️ Ready for **Step 2: Build Credits Service** (`/lib/services/credits.service.ts`)

Tell me when all tests pass and I'll build the service layer! 🚀






