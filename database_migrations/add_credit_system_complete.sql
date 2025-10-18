-- =====================================================
-- REKRUNA CREDIT SYSTEM - DATABASE SCHEMA
-- Phase 1: Database Foundation
-- Run this entire file in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. CREDIT BALANCES TABLE
-- Stores each user's credit balance (subscription + purchased)
-- =====================================================

CREATE TABLE IF NOT EXISTS credit_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Separate credit types for different expiry logic
  subscription_credits INTEGER DEFAULT 0 CHECK (subscription_credits >= 0),
  purchased_credits INTEGER DEFAULT 0 CHECK (purchased_credits >= 0),
  
  -- Auto-calculated total (never update this manually)
  total_credits INTEGER GENERATED ALWAYS AS 
    (subscription_credits + purchased_credits) STORED,
  
  -- Track when subscription credits were last reset (for monthly renewal)
  last_subscription_reset TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_credit_balances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_credit_balances_timestamp
  BEFORE UPDATE ON credit_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_balances_updated_at();

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_credit_balances_user_id 
  ON credit_balances(user_id);

-- =====================================================
-- 2. CREDIT TRANSACTIONS TABLE
-- Audit log for every credit movement (add/deduct/refund)
-- =====================================================

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Transaction details
  amount INTEGER NOT NULL, -- Positive for add, negative for deduct
  balance_after INTEGER NOT NULL, -- Total balance after this transaction
  
  -- Credit type affected
  credit_type TEXT NOT NULL CHECK (credit_type IN ('subscription', 'purchased')),
  
  -- Transaction type
  transaction_type TEXT NOT NULL CHECK (
    transaction_type IN ('purchase', 'subscription_allocation', 'deduction', 'refund', 'subscription_reset')
  ),
  
  -- External references
  stripe_payment_intent_id TEXT, -- Link to Stripe payment (if applicable)
  analysis_id TEXT, -- Link to CV analysis (if applicable)
  
  -- Human-readable description
  description TEXT,
  
  -- Metadata (for future extensibility)
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id 
  ON credit_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_analysis_id 
  ON credit_transactions(analysis_id) 
  WHERE analysis_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_credit_transactions_stripe_payment 
  ON credit_transactions(stripe_payment_intent_id) 
  WHERE stripe_payment_intent_id IS NOT NULL;

-- =====================================================
-- 3. USER SUBSCRIPTIONS TABLE
-- Links users to Stripe subscriptions
-- =====================================================

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Stripe identifiers
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE, -- Null for pay-as-you-go users
  stripe_price_id TEXT, -- Current price they're subscribed to
  
  -- Product information
  product_tier TEXT NOT NULL CHECK (
    product_tier IN ('pay_as_you_go', 'pro', 'business')
  ),
  monthly_credit_allocation INTEGER, -- Null for pay_as_you_go
  
  -- Subscription status
  status TEXT NOT NULL CHECK (
    status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing', 'paused')
  ),
  
  -- Billing cycle
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_subscriptions_timestamp
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_subscriptions_updated_at();

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id 
  ON user_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer 
  ON user_subscriptions(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription 
  ON user_subscriptions(stripe_subscription_id) 
  WHERE stripe_subscription_id IS NOT NULL;

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- Users can only see their own data
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Credit Balances: Users can view their own balance
CREATE POLICY "Users can view own credit balance" 
  ON credit_balances 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Credit Transactions: Users can view their own transaction history
CREATE POLICY "Users can view own credit transactions" 
  ON credit_transactions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- User Subscriptions: Users can view their own subscription
CREATE POLICY "Users can view own subscription" 
  ON user_subscriptions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- =====================================================
-- 5. HELPER FUNCTIONS (Optional but useful)
-- =====================================================

-- Function to initialize credit balance for new user
CREATE OR REPLACE FUNCTION initialize_user_credits(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_balance_id UUID;
BEGIN
  INSERT INTO credit_balances (user_id, subscription_credits, purchased_credits)
  VALUES (p_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO v_balance_id;
  
  RETURN v_balance_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. VERIFICATION QUERIES
-- Run these to confirm tables were created successfully
-- =====================================================

-- Check that all tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('credit_balances', 'credit_transactions', 'user_subscriptions')
ORDER BY table_name;

-- Check that all indexes were created
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename IN ('credit_balances', 'credit_transactions', 'user_subscriptions')
ORDER BY tablename, indexname;

-- Check that RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('credit_balances', 'credit_transactions', 'user_subscriptions')
ORDER BY tablename;

-- =====================================================
-- DONE! 
-- You should see:
-- - 3 tables created
-- - 7 indexes created
-- - 3 RLS policies enabled
-- - 2 triggers for auto-updating timestamps
-- =====================================================


