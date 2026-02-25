-- =====================================================
-- PHASE 3: Rekruna 1/5/10 pakker
-- Ny prisstruktur: 1, 5 eller 10 stillingsopslag
-- Alle engangsbetalinger. job_slots_available til Phase 4.
-- Pay-as-you-go, Pro, Business udgår – kun Rekruna 1/5/10 fremover.
-- =====================================================

-- 1. Add job_slots_available column (for Phase 4 - 75 day flow)
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS job_slots_available INTEGER DEFAULT 0;

-- 2. Drop old product_tier CHECK constraint FØRST (ellers blokerer den UPDATE)
ALTER TABLE user_subscriptions
DROP CONSTRAINT IF EXISTS user_subscriptions_product_tier_check;

-- 3. Migrer eksisterende brugere: gamle tiers → nye
UPDATE user_subscriptions
SET product_tier = CASE product_tier
  WHEN 'pay_as_you_go' THEN 'rekruna_1'
  WHEN 'pro' THEN 'rekruna_5'
  WHEN 'business' THEN 'rekruna_10'
  ELSE product_tier
END
WHERE product_tier IN ('pay_as_you_go', 'pro', 'business');

-- 4. Add new CHECK constraint – kun Rekruna 1/5/10
ALTER TABLE user_subscriptions
ADD CONSTRAINT user_subscriptions_product_tier_check CHECK (
  product_tier IN ('rekruna_1', 'rekruna_5', 'rekruna_10')
);

-- 5. Backfill job_slots for aktive brugere
UPDATE user_subscriptions
SET job_slots_available = CASE product_tier
  WHEN 'rekruna_1' THEN 1
  WHEN 'rekruna_5' THEN 5
  WHEN 'rekruna_10' THEN 10
  ELSE COALESCE(job_slots_available, 0)
END
WHERE status = 'active';

-- Verify
SELECT product_tier, job_slots_available, status
FROM user_subscriptions
LIMIT 5;
