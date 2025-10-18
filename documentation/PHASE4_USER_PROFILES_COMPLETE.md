# 🎯 Phase 4: User Profiles & Billing Integration - COMPLETE

## 📋 Oversigt

Vi har bygget komplet bruger profil system med dynamisk signup flow og Stripe billing integration.

---

## ✅ Hvad Er Bygget

### 1. **Database Tables**

#### `user_profiles` Tabel
```sql
- user_id (UUID, FK til auth.users)
- company_name (TEXT)
- contact_person (TEXT) 
- cvr_number (TEXT)
- address (TEXT)
- postal_code (TEXT)
- city (TEXT)
- email (TEXT) - Business email (kan være forskellig fra login email)
- phone (TEXT, optional)
- marketing_consent (BOOLEAN)
- created_at, updated_at
```

#### `analysis_results` Tabel (sikret oprettet)
```sql
- id, user_id, analysis_id
- name (kandidat navn)
- title (job titel)
- overall (score)
- scores, strengths, concerns (JSONB)
- created_at
```

**Migrationer:** 
- `database_migrations/add_user_profiles_table.sql`
- `database_migrations/ensure_analysis_results_table.sql`

---

### 2. **API Endpoints**

#### `/api/profile` (GET & POST)
```typescript
// GET - Hent bruger profil
Authorization: Bearer {token}
Response: { success, data: profile }

// POST - Opret/opdater profil
Body: {
  company_name, contact_person, cvr_number,
  address, postal_code, city, email,
  phone?, marketing_consent
}
Response: { success, data: profile }
```

---

### 3. **Opdateret Signup Flow**

#### **Landing Page → Signup Flow**
```
1. Bruger klikker "Start i dag" på Pro plan
   ↓
2. Redirect til: /signup?plan=pro&price=549&discount=200
   ↓
3. Signup side viser dynamisk:
   - "Rekruna Pro"
   - "Pris pr. måned: 549 kr" (line-through)
   - "Din rabat: 200 kr"
   - "Din månedlige pris: 349 kr"
   ↓
4. Bruger udfylder form:
   - Firma navn
   - Kontaktperson
   - CVR nummer
   - Adresse, Postnr, By
   - Email (business)
   - Password
   - ✓ Marketing consent (optional)
   - ✓ Accept handelsbetingelser (required)
   ↓
5. Klik "Til betaling"
   ↓
6. Backend:
   a) Opret Supabase auth user
   b) Gem profil i user_profiles
   c) Opret Stripe checkout session
   d) Return checkout URL
   ↓
7. Redirect til Stripe Checkout (PRE-FILLED!)
   ↓
8. After payment → /dinprofil?payment=success
```

#### **Dynamisk Plan Display**
- **Pay as you go:** "Engangsbetaling: 499 kr"
- **Pro:** "Pris pr. måned: 549 kr" → Rabat 200 kr → "Din månedlige pris: 349 kr"
- **Business:** "Pris pr. måned: 699 kr"

---

### 4. **Stripe Billing Pre-Fill (INGEN DOBBELT INDTASTNING!)**

#### **Checkout Flow Opdateringer**

**`/api/checkout/route.ts`:**
1. Hent user profile fra database
2. Send profil data til Stripe
3. Success URL: `/dinprofil?payment=success`
4. Cancel URL: `/?payment=canceled`

**`lib/services/stripe.service.ts`:**
1. **Før checkout:** Opdater Stripe Customer med profil data
   ```typescript
   stripe.customers.update(customerId, {
     name: profile.company_name,
     address: {
       line1: profile.address,
       postal_code: profile.postal_code,
       city: profile.city,
       country: 'DK'
     }
   })
   ```

2. **Checkout session:** `billing_address_collection: 'auto'`
   - Stripe viser billing felter
   - **Men pre-fylder dem med data fra customer object!**
   - Bruger skal ikke taste det igen! ✅

---

### 5. **Opdaterede Komponenter**

#### **`components/auth/SignupForm.tsx`**
**Fjernet:**
- ❌ Card payment felter (kortnummer, CVV, etc.)

**Tilføjet:**
- ✅ Marketing consent checkbox
- ✅ Dynamisk plan display (baseret på props)
- ✅ Dynamisk rabat display (kun hvis rabat > 0)
- ✅ "Pris pr. måned" vs "Engangsbetaling" (based på subscription type)
- ✅ Button: "Til betaling" (tidligere "Opret konto")

#### **`app/(auth)/signup/page.tsx`**
**Ny funktionalitet:**
- Parse URL parameters (`plan`, `price`, `discount`)
- Opret auth user → Gem profil → Redirect til Stripe
- Send plan data til SignupForm component

#### **`app/page.tsx`**
**Opdateret handleCheckout:**
- Nye brugere → `/signup?plan=X&price=X&discount=X`
- Eksisterende brugere → Direkte til `/api/checkout`

---

## 🔄 User Flows

### **Ny Bruger Flow**
```
Landing Page
  → Klik "Start i dag" (Pro Plan)
  → /signup?plan=pro&price=549&discount=200
  → Udfyld form
  → Klik "Til betaling"
  → Stripe Checkout (pre-filled!)
  → /dinprofil?payment=success
```

### **Eksisterende Bruger Flow**
```
Landing Page (logged in)
  → Klik "Start i dag" (Pro Plan)
  → /api/checkout (direkte)
  → Stripe Checkout (pre-filled fra eksisterende profil!)
  → /dinprofil?payment=success
```

---

## 📊 Plan Pricing Configuration

### **Landing Page**
```typescript
const planPricing = {
  pay_as_you_go: { price: 499, discount: 0 },
  pro: { price: 549, discount: 200 },
  business: { price: 699, discount: 0 }
}
```

### **Signup Form**
```typescript
const planNames = {
  pay_as_you_go: 'Pay as you go',
  pro: 'Pro',
  business: 'Business'
}

const planTypes = {
  pay_as_you_go: 'one_time',
  pro: 'subscription',
  business: 'subscription'
}
```

---

## 🧪 Testing Guide

### **1. Test Signup Flow**
```
1. Åbn landing page (ikke logget ind)
2. Klik "Start i dag" på Pro Plan
3. Verify URL: /signup?plan=pro&price=549&discount=200
4. Verify display:
   - "Rekruna Pro"
   - "Pris pr. måned: 549 kr" (line-through)
   - "Din rabat: 200 kr"
   - "Din månedlige pris: 349 kr"
5. Udfyld form med test data
6. Klik "Til betaling"
7. Verify redirect til Stripe Checkout
8. Verify billing address ER pre-filled! ✅
```

### **2. Test Database**
```sql
-- Check user profile created
SELECT * FROM user_profiles 
WHERE user_id = 'YOUR_USER_ID';

-- Should show:
-- company_name, contact_person, cvr_number, 
-- address, postal_code, city, email, marketing_consent
```

### **3. Test Existing User Checkout**
```
1. Log ind med eksisterende user
2. Klik "Start i dag" på Business Plan
3. Verify går direkte til Stripe (ikke signup)
4. Verify billing address pre-filled fra profil
```

---

## 🎨 UI Changes Summary

### **Signup Form**
| Before | After |
|--------|-------|
| Static "Rekruna One" plan | Dynamic plan display (Pro/Business/PAYG) |
| Hard-coded "149 kr" | Dynamic pricing with optional discount |
| Card payment fields | ❌ Removed (Stripe handles it) |
| No marketing consent | ✅ Added checkbox |
| "Opret konto" button | "Til betaling" button |

### **Landing Page**
| Before | After |
|--------|-------|
| Redirect to `/signup` | Redirect to `/signup?plan=X&price=X&discount=X` |
| N/A | Check if user logged in |
| N/A | Logged in users → direct checkout |

---

## 🔐 Security & Privacy

### **RLS Policies**
```sql
-- Users can only see/update their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

### **Marketing Consent**
- Explicit opt-in checkbox
- Stored in `user_profiles.marketing_consent`
- Defaults to `false`
- Indexed for fast filtering

---

## 📝 Environment Variables (No Changes)

All Stripe keys remain the same:
```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...
STRIPE_PAYG_PRICE_ID=price_...
```

---

## ⏭️ Næste Steps

### **I Morgen: Production Deployment**

1. **Deploy til production:**
   - Verify `.env.local` has `NEXT_PUBLIC_APP_URL=https://app.rekruna.dk`
   - Deploy code
   - Run database migrations in Supabase

2. **Test på live site:**
   - Signup flow med test card
   - Verify billing pre-fill virker
   - Verify credits tilføjes efter payment
   - Test Pro/Business/PAYG plans

3. **Verify Stripe:**
   - Webhook URL: `https://app.rekruna.dk/api/webhooks/stripe`
   - Test events kommer igennem
   - Verify customer address data i Stripe Dashboard

---

## 🚧 Future Enhancements (Phase 5)

### **Profil Side (`/dinprofil`)**
Skal bygges med:
- Plan info box
- Credits display
- Køb ekstra credits (boost pakker)
- Seneste analyser historik
- Redigerbar profil form
- Link til start ny analyse

Vi bygger denne side når signup/checkout flow er testet og virker 100% i production.

---

## ✅ Success Criteria

- [x] Database tables oprettet med RLS
- [x] API endpoint til profil CRUD
- [x] Signup form opdateret med alle felter
- [x] Dynamisk plan display på signup
- [x] Marketing consent checkbox
- [x] Stripe billing pre-fill (ingen dobbelt indtastning)
- [x] Success URL peger til `/dinprofil`
- [x] Existing users redirect direkte til checkout
- [x] New users går gennem signup først

---

**Status:** ✅ **KLAR TIL DEPLOYMENT I MORGEN**

God nat! 🌙



