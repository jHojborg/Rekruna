-- =====================================================
-- PHASE 1: DROP CREDIT TABLES
-- Credits system removed - Rekruna moves to job-slot model
-- Run this in Supabase SQL Editor AFTER deploying Phase 1 code
-- =====================================================
--
-- IMPORTANT: Backup any data you need before running!
-- This permanently deletes credit_balances and credit_transactions.
--

-- Drop credit_transactions first (no FK to credit_balances, but safer order)
DROP TABLE IF EXISTS credit_transactions;

-- Drop credit_balances
DROP TABLE IF EXISTS credit_balances;

-- Verify
SELECT 'Phase 1: Credit tables dropped successfully' AS status;
