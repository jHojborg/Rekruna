# 🚀 Deployment Checklist - Rekruna User Profiles & Stripe

## 📋 Pre-Deployment

### **1. Database Migration (5 min)**
```sql
-- Run in Supabase SQL Editor (in order):

1. database_migrations/add_user_profiles_table.sql
2. database_migrations/ensure_analysis_results_table.sql
```

**Verify:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'analysis_results');

-- Should return 2 rows
```

---

### **2. Environment Variables**
Verify `.env.local` (eller production env) har:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App URL (VIGTIGT!)
NEXT_PUBLIC_APP_URL=https://app.rekruna.dk  # Production
# ELLER
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Local testing

# Stripe
STRIPE_SECRET_KEY=sk_test_...  # (eller sk_live_... for prod)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
STRIPE_PAYG_PRICE_ID=price_xxx
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_BUSINESS_PRICE_ID=price_xxx
STRIPE_BOOST_50_PRICE_ID=price_xxx
STRIPE_BOOST_100_PRICE_ID=price_xxx
STRIPE_BOOST_250_PRICE_ID=price_xxx
STRIPE_BOOST_500_PRICE_ID=price_xxx
```

---

### **3. Stripe Webhook Configuration**

**I Stripe Dashboard:**
1. Gå til **Developers → Webhooks**
2. Klik **"Add endpoint"**
3. Endpoint URL: `https://app.rekruna.dk/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `invoice.paid`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy **Signing secret** → Opdater `STRIPE_WEBHOOK_SECRET` i env

---

## 🧪 Testing Procedure

### **Test 1: Ny Bruger Signup (10 min)**

#### **Step 1: Signup Flow**
```
1. Åbn https://app.rekruna.dk (ikke logget ind)
2. Klik "Start i dag" på Pro Plan
3. ✅ Verify URL: /signup?plan=pro&price=549&discount=200
4. ✅ Verify display:
   - "Rekruna Pro"
   - "Pris pr. måned: 549 kr" (line-through)
   - "Din rabat: 200 kr"
   - "Din månedlige pris: 349 kr"
5. Udfyld form:
   - Firma: "Test Company ApS"
   - Kontakt: "Test Person"
   - CVR: "12345678"
   - Adresse: "Testvej 123"
   - Postnr: "2000"
   - By: "Frederiksberg"
   - Email: "test@example.com"
   - Password: "Test1234!"
   - ✓ Marketing consent
   - ✓ Accept handelsbetingelser
6. Klik "Til betaling"
7. ✅ Redirect til Stripe Checkout
```

#### **Step 2: Stripe Checkout**
```
8. ✅ Verify billing address ER pre-filled:
   - Name: "Test Company ApS"
   - Address: "Testvej 123"
   - Postal code: "2000"
   - City: "Frederiksberg"
   - Country: "Denmark"
9. Use Stripe test card:
   - Card: 4242 4242 4242 4242
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
10. Klik "Pay and subscribe"
11. ✅ Redirect til: /dinprofil?payment=success
```

#### **Step 3: Verify Database**
```sql
-- Check user created
SELECT id, email FROM auth.users 
WHERE email = 'test@example.com';

-- Check profile created
SELECT * FROM user_profiles 
WHERE email = 'test@example.com';

-- Expected: company_name, contact_person, cvr_number, address, etc.

-- Check credits added
SELECT * FROM credit_balances 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');

-- Expected: total_credits = 400 (Pro plan)

-- Check subscription created
SELECT * FROM user_subscriptions 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');

-- Expected: product_tier = 'pro', status = 'active'
```

#### **Step 4: Verify Stripe Dashboard**
```
1. Gå til Stripe Dashboard → Customers
2. Find "Test Company ApS"
3. ✅ Verify customer address data present
4. ✅ Verify subscription active
5. Gå til Developers → Webhooks → Your endpoint
6. ✅ Verify "checkout.session.completed" event received (200 response)
```

---

### **Test 2: Pay As You Go (5 min)**

```
1. Ny inkognito vindue (ikke logget ind)
2. Klik "Start i dag" på Pay As You Go
3. ✅ Verify URL: /signup?plan=pay_as_you_go&price=499&discount=0
4. ✅ Verify display:
   - "Rekruna Pay as you go"
   - "Engangsbetaling: 499 kr" (IKKE "pr. måned")
   - INGEN rabat vist
5. Udfyld form → Klik "Til betaling"
6. Stripe checkout → Test card → Pay
7. ✅ Verify credits = 200 (ikke 400)
8. ✅ Verify NO subscription i database
```

---

### **Test 3: Business Plan (5 min)**

```
1. Ny inkognito vindue
2. Klik "Start i dag" på Business Plan
3. ✅ Verify URL: /signup?plan=business&price=699&discount=0
4. ✅ Verify display:
   - "Rekruna Business"
   - "Pris pr. måned: 699 kr"
   - INGEN rabat
5. Udfyld → Betaling → Verify credits = 1000
```

---

### **Test 4: Eksisterende Bruger (3 min)**

```
1. Log ind med eksisterende bruger
2. Gå til landing page
3. Klik "Start i dag" på Business Plan
4. ✅ Verify SPRINGER signup over
5. ✅ Går direkte til Stripe Checkout
6. ✅ Billing address pre-filled fra eksisterende profil
```

---

## 🚨 Rollback Plan

Hvis noget går galt:

### **Quick Rollback**
```bash
# 1. Revert code
git revert HEAD

# 2. Deploy forrige version
# (eller vent til bug fix)

# 3. Database er backwards compatible
# - Nye tables påvirker ikke eksisterende functionality
# - Kan lades stå
```

### **Database Rollback (kun hvis nødvendigt)**
```sql
-- ONLY IF ABSOLUTELY NECESSARY
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS analysis_results CASCADE;
```

---

## ✅ Success Criteria

Efter deployment skal alle disse virke:

### **Funktionalitet**
- [ ] Ny bruger kan signup via alle 3 plans
- [ ] Dynamisk plan display vises korrekt
- [ ] Billing address pre-fills i Stripe
- [ ] Credits tilføjes efter betaling
- [ ] Webhook events modtages (200 response)
- [ ] Eksisterende brugere kan købe (skip signup)

### **Database**
- [ ] `user_profiles` table exists
- [ ] `analysis_results` table exists
- [ ] RLS policies active
- [ ] Data gemmes korrekt

### **Stripe**
- [ ] Webhook endpoint aktiv
- [ ] Customer address data syncs
- [ ] Subscriptions oprettes korrekt
- [ ] Test payments går igennem

---

## 📞 Support Contacts

**Hvis problemer:**
- Supabase Support: support@supabase.io
- Stripe Support: support@stripe.com
- Cursor AI Support: (dig selv! 😄)

---

## 📊 Monitoring

### **Efter Deployment - Monitor I 24 Timer**

**Check hvert 2-4 timer:**
1. Stripe Dashboard → Webhooks (verify events kommer igennem)
2. Supabase Dashboard → Database (verify data gemmes)
3. Error logs i production (check for crashes)

**Expected Metrics (dag 1):**
- Signup conversion rate: Monitor
- Webhook success rate: >99%
- Database write errors: 0

---

## 🎉 Post-Deployment

Når alt virker:

### **1. Send Test Email**
```
To: jan@rekruna.dk
Subject: Rekruna Signup System - Live! 🚀

Den nye signup flow er live og testet!

Funktioner:
✅ Dynamisk plan display
✅ Billing pre-fill (ingen dobbelt indtastning)
✅ Marketing consent
✅ Database integration
✅ Stripe webhooks

Test selv på: https://app.rekruna.dk

/Din AI assistent
```

### **2. Document Learnings**
- Noter eventuelle bugs/quirks
- Opdater dokumentation hvis nødvendigt
- Plan Phase 5: Profil side

---

**God deployment! 🚀**



