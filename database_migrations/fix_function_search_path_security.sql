-- =====================================================
-- SECURITY FIX: Function Search Path Mutable
-- This fixes all database functions flagged by Supabase Security Advisor
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. FIX: set_event_expiry_date()
-- Fixes search path vulnerability in event expiry calculation
-- =====================================================

CREATE OR REPLACE FUNCTION set_event_expiry_date()
RETURNS TRIGGER AS $$
BEGIN
  -- If account_type is EVENT and event_signup_date is set
  -- Calculate expiry as 14 days after signup
  IF NEW.account_type = 'EVENT' AND NEW.event_signup_date IS NOT NULL THEN
    NEW.event_expiry_date := NEW.event_signup_date + INTERVAL '14 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp;

COMMENT ON FUNCTION set_event_expiry_date() IS 'Automatically calculates EVENT account expiry date (signup + 14 days). SECURITY: Uses explicit search_path to prevent injection.';

-- =====================================================
-- 2. FIX: update_credit_balances_updated_at()
-- Fixes search path vulnerability in timestamp update
-- =====================================================

CREATE OR REPLACE FUNCTION update_credit_balances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-update the updated_at timestamp on credit balance changes
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp;

COMMENT ON FUNCTION update_credit_balances_updated_at() IS 'Auto-updates updated_at timestamp for credit_balances table. SECURITY: Uses explicit search_path.';

-- =====================================================
-- 3. FIX: update_user_subscriptions_updated_at()
-- Fixes search path vulnerability in subscription timestamp update
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-update the updated_at timestamp on subscription changes
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp;

COMMENT ON FUNCTION update_user_subscriptions_updated_at() IS 'Auto-updates updated_at timestamp for user_subscriptions table. SECURITY: Uses explicit search_path.';

-- =====================================================
-- 4. FIX: initialize_user_credits()
-- Fixes search path vulnerability in credit initialization
-- =====================================================

CREATE OR REPLACE FUNCTION initialize_user_credits(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_balance_id UUID;
BEGIN
  -- Initialize credit balance for new user (0 credits)
  -- Uses ON CONFLICT to prevent duplicate entries
  INSERT INTO credit_balances (user_id, subscription_credits, purchased_credits)
  VALUES (p_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO v_balance_id;
  
  RETURN v_balance_id;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp;

COMMENT ON FUNCTION initialize_user_credits(UUID) IS 'Initializes credit balance for new user. SECURITY: Uses explicit search_path to prevent injection.';

-- =====================================================
-- 5. FIX: update_job_templates_updated_at()
-- Fixes search path vulnerability in job template timestamp update
-- =====================================================

CREATE OR REPLACE FUNCTION update_job_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-update the updated_at timestamp on template changes
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp;

COMMENT ON FUNCTION update_job_templates_updated_at() IS 'Auto-updates updated_at timestamp for job_templates table. SECURITY: Uses explicit search_path.';

-- =====================================================
-- 6. FIX: update_user_profiles_updated_at()
-- Fixes search path vulnerability in user profile timestamp update
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-update the updated_at timestamp on profile changes
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp;

COMMENT ON FUNCTION update_user_profiles_updated_at() IS 'Auto-updates updated_at timestamp for user_profiles table. SECURITY: Uses explicit search_path.';

-- =====================================================
-- 7. FIX: update_demo_leads_updated_at()
-- Fixes search path vulnerability in demo leads timestamp update
-- =====================================================

CREATE OR REPLACE FUNCTION update_demo_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-update the updated_at timestamp on demo lead changes
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp;

COMMENT ON FUNCTION update_demo_leads_updated_at() IS 'Auto-updates updated_at timestamp for demo_leads table. SECURITY: Uses explicit search_path.';

-- =====================================================
-- VERIFICATION
-- Check that all functions now have proper security settings
-- =====================================================

SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  proconfig as search_path_config
FROM pg_proc 
WHERE proname IN (
  'set_event_expiry_date',
  'update_credit_balances_updated_at',
  'update_user_subscriptions_updated_at',
  'initialize_user_credits',
  'update_job_templates_updated_at',
  'update_user_profiles_updated_at',
  'update_demo_leads_updated_at'
)
ORDER BY proname;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT '✅ All 7 database functions have been secured with explicit search_path!' as status;


