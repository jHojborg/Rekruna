# Phase 2: Stripe Integration - Testing Guide

## 🎯 Hvad Vi Har Bygget

✅ **Stripe Service** (`/lib/services/stripe.service.ts`)  
✅ **Checkout Endpoint** (`/app/api/checkout/route.ts`)  
✅ **Webhook Endpoint** (`/app/api/webhooks/stripe/route.ts`)  

---

## 🧪 Test Setup

### Step 1: Verify Environment Variables

Tjek at du har udfyldt alle disse i `.env.local`:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Price IDs (all 7)
STRIPE_PAYG_PRICE_ID=price_xxx
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_BUSINESS_PRICE_ID=price_xxx
STRIPE_BOOST_50_PRICE_ID=price_xxx
STRIPE_BOOST_100_PRICE_ID=price_xxx
STRIPE_BOOST_250_PRICE_ID=price_xxx
STRIPE_BOOST_500_PRICE_ID=price_xxx
```

---

### Step 2: Install Stripe CLI (For Local Webhook Testing)

Dette tool lader os teste webhooks lokalt uden at deploy til production.

**Mac:**
```bash
brew install stripe/stripe-cli/stripe
```

**Windows:**
Download fra https://github.com/stripe/stripe-cli/releases

**Login:**
```bash
stripe login
```

---

### Step 3: Start Webhook Forwarding

I én terminal:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Dette giver dig en **webhook signing secret** - kopier den til `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

**Lad denne terminal køre!** Den viser alle webhooks der sendes.

---

## 🧪 Test 1: Pay as you go Purchase (One-Time)

### Test Med Stripe CLI

I en anden terminal:
```bash
stripe trigger checkout.session.completed
```

**Dette simulerer:**
- User betaler 499 DKK
- Køber Pay as you go (200 credits)

**Forventet i webhook terminal:**
```
checkout.session.completed [evt_xxx]
```

**Tjek console logs (din dev server):**
```
📨 Stripe webhook received: checkout.session.completed
💳 Processing checkout.session.completed...
✅ Checkout processed successfully
✅ One-time purchase for user xxx: 200 credits
```

**Verificer i Supabase:**
```sql
SELECT * FROM credit_balances WHERE user_id = 'YOUR_USER_ID';
-- purchased_credits should be +200

SELECT * FROM credit_transactions 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC LIMIT 1;
-- Should show purchase transaction
```

---

## 🧪 Test 2: Pro Subscription

### Opret Test Checkout (Via Code)

Opret en midlertidig test fil eller brug Postman:

```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -d '{
    "priceId": "YOUR_PRO_PRICE_ID",
    "tier": "pro"
  }'
```

**Response:**
```json
{
  "success": true,
  "url": "https://checkout.stripe.com/c/pay/xxx"
}
```

Åbn denne URL i browser og betal med test card:
- **Card:** `4242 4242 4242 4242`
- **Expiry:** Any future date
- **CVC:** Any 3 digits

**Efter betaling:**

**Webhook terminal viser:**
```
checkout.session.completed [evt_xxx]
```

**Console logs:**
```
📨 Stripe webhook received: checkout.session.completed
💳 Processing checkout.session.completed...
✅ Subscription activated for user xxx: 400 credits
```

**Verificer i Supabase:**
```sql
-- Credit balance
SELECT * FROM credit_balances WHERE user_id = 'YOUR_USER_ID';
-- subscription_credits should be 400

-- Subscription record
SELECT * FROM user_subscriptions WHERE user_id = 'YOUR_USER_ID';
-- Should show:
--   product_tier: 'pro'
--   status: 'active'
--   monthly_credit_allocation: 400
--   stripe_subscription_id: 'sub_xxx'

-- Transaction
SELECT * FROM credit_transactions 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC LIMIT 1;
-- Should show subscription_allocation
```

---

## 🧪 Test 3: Monthly Subscription Renewal

Simuler en månedlig betaling:

```bash
stripe trigger invoice.paid
```

**Forventet:**
```
📨 Stripe webhook received: invoice.paid
💰 Processing invoice.paid (subscription renewal)...
✅ Subscription renewed for user xxx: 400 credits
```

**Verificer i Supabase:**
```sql
SELECT subscription_credits, last_subscription_reset 
FROM credit_balances 
WHERE user_id = 'YOUR_USER_ID';

-- subscription_credits should be RESET to 400 (not added!)
-- last_subscription_reset should be NOW
```

---

## 🧪 Test 4: Top-Up (Boost Purchase)

**Kræver:** User skal have et aktivt Pro/Business abonnement først!

```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -d '{
    "priceId": "YOUR_BOOST_100_PRICE_ID",
    "tier": "boost_100"
  }'
```

Betal med test card.

**Forventet:**
```
✅ One-time purchase for user xxx: 100 credits
```

**Verificer:**
```sql
SELECT 
  subscription_credits,  -- Should be unchanged (still 400)
  purchased_credits,     -- Should be +100
  total_credits          -- Should be 500 (400 + 100)
FROM credit_balances 
WHERE user_id = 'YOUR_USER_ID';
```

---

## 🧪 Test 5: Subscription Cancellation

Simuler at user canceller:

```bash
stripe trigger customer.subscription.deleted
```

**Forventet:**
```
📨 Stripe webhook received: customer.subscription.deleted
❌ Processing subscription.deleted...
✅ Subscription cancellation processed successfully
```

**Verificer:**
```sql
-- Subscription status
SELECT status FROM user_subscriptions WHERE user_id = 'YOUR_USER_ID';
-- Should be 'canceled'

-- Credits
SELECT 
  subscription_credits,  -- Should be 0 (removed)
  purchased_credits,     -- Should be unchanged (kept forever!)
  total_credits
FROM credit_balances WHERE user_id = 'YOUR_USER_ID';
```

---

## 🧪 Test 6: End-to-End Flow

### Komplet bruger flow:

1. **Bruger starter uden credits**
```sql
SELECT * FROM credit_balances WHERE user_id = 'USER_ID';
-- Should show 0 credits (or not exist yet)
```

2. **Bruger køber Pay as you go**
```bash
# Call checkout endpoint
# Pay with test card
```

**Resultat:**
```
purchased_credits: 200
total_credits: 200
```

3. **Bruger upgrader til Pro**
```bash
# Call checkout endpoint for Pro
# Pay with test card
```

**Resultat:**
```
subscription_credits: 400
purchased_credits: 200
total_credits: 600
```

4. **Bruger analyserer 50 CVs**
```bash
# Upload 50 CVs via app
```

**Resultat:**
```
subscription_credits: 350 (400 - 50)
purchased_credits: 200 (unchanged)
total_credits: 550
```

5. **Næste måned - Subscription renewal**
```bash
stripe trigger invoice.paid
```

**Resultat:**
```
subscription_credits: 400 (RESET, not added!)
purchased_credits: 200 (unchanged)
total_credits: 600
```

6. **Bruger køber Boost 100**
```bash
# Call checkout for boost_100
# Pay with test card
```

**Resultat:**
```
subscription_credits: 400
purchased_credits: 300 (200 + 100)
total_credits: 700
```

---

## ✅ Success Checklist

Test er succesful når:

- [ ] ✅ Pay as you go purchase tilføjer 200 purchased_credits
- [ ] ✅ Pro subscription opretter user_subscriptions record
- [ ] ✅ Pro subscription tilføjer 400 subscription_credits
- [ ] ✅ Monthly renewal resetter (ikke adderer) subscription_credits
- [ ] ✅ Top-up kun virker for Pro/Business users
- [ ] ✅ Top-up tilføjer til purchased_credits
- [ ] ✅ Cancellation fjerner subscription_credits
- [ ] ✅ Cancellation beholder purchased_credits
- [ ] ✅ Alle transactions logges i credit_transactions
- [ ] ✅ Webhook signature verification virker

---

## 🐛 Troubleshooting

### Error: "Missing stripe-signature header"
**Fix:** Du kalder webhook endpoint direkte. Brug `stripe trigger` eller Stripe CLI.

### Error: "Invalid signature"
**Fix:** `STRIPE_WEBHOOK_SECRET` er forkert. Brug secret fra `stripe listen` output.

### Error: "Missing STRIPE_SECRET_KEY"
**Fix:** Udfyld `.env.local` med dine Stripe keys og restart server.

### Credits ikke tilføjet efter betaling
**Fix:** 
1. Tjek webhook terminal - kom beskeden igennem?
2. Tjek console logs - var der fejl?
3. Tjek product metadata i Stripe - har den `credits` field?

### "Top-ups only available for subscribers" fejl
**Fix:** User skal have et aktivt Pro/Business abonnement først.

---

## 🎯 Næste Steps

Når alle tests passer:
1. ✅ Phase 2 er complete!
2. ➡️ Ready for production (når du skifter til live keys)
3. 🎨 Build frontend UI (Phase 4)

---

## 📞 Quick Commands Reference

```bash
# Start webhook forwarding
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger customer.subscription.deleted

# View recent events
stripe events list --limit 10

# View specific event details
stripe events retrieve evt_xxx
```

---

**Klar til at teste!** 🚀





