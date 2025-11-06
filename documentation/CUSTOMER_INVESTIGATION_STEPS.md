# 🔍 Investigation: c.rysgaard@tbauctions.com

**Status:** User har fået 200 credits  
**Spørgsmål:** Gik betalingen igennem?

---

## 📋 Step-by-Step Undersøgelse

### Step 1: Find User ID i Supabase

Gå til **Supabase SQL Editor** og kør:

```sql
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users
WHERE email = 'c.rysgaard@tbauctions.com';
```

**Kopier `user_id` og brug det i næste steps** ⬇️

---

### Step 2: Tjek Credit Transaction (Vigtigste!)

Brug user_id fra Step 1:

```sql
SELECT 
  id,
  amount,
  balance_after,
  credit_type,
  transaction_type,
  stripe_payment_intent_id,  -- ⭐ DETTE ER KEY!
  description,
  created_at
FROM credit_transactions
WHERE user_id = 'USER_ID_HER'  -- Indsæt user_id fra Step 1
ORDER BY created_at DESC;
```

### ❓ Hvad Skal I Se Efter?

| Scenarie | `stripe_payment_intent_id` | Konklusion |
|----------|---------------------------|------------|
| ✅ Betaling OK | `pi_xxxxxxxxxxxxx` (fyldt ud) | Betaling gik igennem! |
| ❌ Ingen betaling | `NULL` eller tom | Bruger fik credits UDEN betaling! |

---

### Step 3: Tjek Subscription Status

```sql
SELECT 
  stripe_customer_id,
  stripe_subscription_id,
  product_tier,
  status,
  created_at
FROM user_subscriptions
WHERE user_id = 'USER_ID_HER';  -- Indsæt user_id
```

**Kopier `stripe_customer_id`** - bruges i Step 4

---

### Step 4: Tjek Stripe Dashboard

1. Gå til https://dashboard.stripe.com
2. **Tjek om I er i Test Mode eller Live Mode** (øverste højre hjørne)
   - 🔴 Test Mode = Ingen rigtige betalinger
   - 🟢 Live Mode = Rigtige betalinger

3. Søg efter kunden:
   - Klik på "Customers" i venstre menu
   - Søg efter email: `c.rysgaard@tbauctions.com`
   - ELLER brug customer ID fra Step 3

4. Tjek Payment History:
   - Ser du en payment på 499 DKK (Pay as you go)?
   - Status: **Succeeded** eller **Failed**?

---

## 🚨 Mulige Scenarier

### Scenarie A: Payment Intent = NULL (Ingen Betaling)

**Det betyder:**
- Brugeren fik credits pga. den bug vi lige fixede
- Ingen betaling gik igennem
- Dette er præcis hvad vores fix forhindrer fremover

**Hvad skal I gøre:**
```sql
-- Fjern credits
UPDATE credit_balances
SET 
  purchased_credits = 0,
  subscription_credits = 0
WHERE user_id = 'USER_ID_HER';

-- Sæt subscription til incomplete
UPDATE user_subscriptions
SET status = 'incomplete'
WHERE user_id = 'USER_ID_HER';

-- Opret audit log
INSERT INTO credit_transactions (
  user_id,
  amount,
  balance_after,
  credit_type,
  transaction_type,
  description
) VALUES (
  'USER_ID_HER',
  -200,
  0,
  'purchased',
  'refund',
  'Credits removed - payment not completed. Bug fix applied.'
);
```

**Send email til kunden:**
```
Hej [navn],

Vi opdagede en teknisk fejl i vores betalingssystem, hvor din konto 
fik tildelt credits selvom betalingen ikke blev gennemført.

Vi har derfor nulstillet din konto.

Hvis du stadig ønsker at bruge Rekruna, kan du gennemføre betalingen her:
[link til signup/betaling]

Beklager ulejligheden!

Mvh,
Rekruna
```

---

### Scenarie B: Payment Intent Findes (Betaling Gik Igennem)

**Det betyder:**
- Betalingen gik igennem som forventet
- Alt er OK, intet problem!
- Måske var det Stripe's Test Mode?

**Hvad skal I gøre:**
1. Tjek i Stripe dashboard om det var en rigtig betaling
2. Hvis Test Mode: Se Scenarie A
3. Hvis Live Mode: Alt er godt! ✅

---

### Scenarie C: I Er i Test Mode

**Det betyder:**
- I kører jeres Stripe integration i test mode
- Alle "betalinger" er fake
- Kunder kan bruge test cards (4242 4242 4242 4242)

**Hvad skal I gøre:**
1. Gå til Stripe Dashboard
2. Skift til **Live Mode** (toggle øverst til højre)
3. Opdater environment variables med **live mode keys**:
   ```
   STRIPE_SECRET_KEY=sk_live_xxxxx  (IKKE sk_test_xxxxx)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
   ```
4. Redeploy jeres app
5. Kontakt alle test-brugere og bed dem tilmelde sig igen

---

## ✅ Quick Checklist

- [ ] Fundet user_id i Step 1
- [ ] Tjekket credit_transactions i Step 2
- [ ] Noteret om `stripe_payment_intent_id` er NULL eller fyldt
- [ ] Tjekket Stripe dashboard
- [ ] Bekræftet Test Mode vs Live Mode
- [ ] Besluttet handling baseret på scenarie

---

## 📞 Næste Skridt

Når I har kørt disse checks, så:

1. **Hvis payment intent = NULL:** Kør SQL i Scenarie A
2. **Hvis I er i Test Mode:** Følg Scenarie C
3. **Hvis alt er OK:** Ingen handling nødvendig

Lad mig vide hvad I finder! 🔍






