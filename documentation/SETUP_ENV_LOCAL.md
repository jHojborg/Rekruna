# .env.local Setup Guide

## 🔐 Konfigurer Environment Variables

Nu skal du oprette `.env.local` filen med alle dine Stripe keys og Price IDs.

---

## Step 1: Kopier Template

Kør i terminal:
```bash
cp env.example .env.local
```

---

## Step 2: Hent Stripe API Keys

### Publishable Key & Secret Key

1. Gå til Stripe Dashboard: https://dashboard.stripe.com/
2. Klik **Developers** (øverst til højre)
3. Klik **API keys** i venstre menu
4. Sørg for at være i **Test mode** (toggle øverst)
5. Kopier:
   - **Publishable key** (pk_test_xxx)
   - **Secret key** (sk_test_xxx) - klik "Reveal"

---

## Step 3: Hent Price IDs

For hvert af dine 7 produkter:

1. Gå til **Product catalog** i Stripe Dashboard
2. Klik på produktet (f.eks. "Pay as you go")
3. Find **Pricing** sektionen
4. Kopier **Price ID** (starter med `price_xxx`)

Du skal have **7 Price IDs i alt:**
Pay as you go:    price_1SIa6uE1xsS6Ocr7ZbhmwyjK
Pro Plan:         price_1SIa8VE1xsS6Ocr7H1y2iPzx
Business Plan:    price_1SIa8wE1xsS6Ocr7qcpiWSIs
Boost 50:         price_1SIa9lE1xsS6Ocr7Osy7TGJs
Boost 100:        price_1SIaB8E1xsS6Ocr7i6B2jxJ1
Boost 250:        price_1SIaBTE1xsS6Ocr7eph3DVxd
Boost 500:        price_1SIaBzE1xsS6Ocr7PdwHNVBX

---

## Step 4: Udfyld .env.local

Åbn `.env.local` i Cursor og udfyld:

```bash
# Supabase Configuration (lad være som de er - allerede konfigureret)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# OpenAI Configuration (lad være - allerede konfigureret)
OPENAI_API_KEY=your_openai_api_key_here

# =====================================================
# STRIPE CONFIGURATION - UDFYLD DISSE!
# =====================================================

# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_PASTE_DIN_SECRET_KEY_HER
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_PASTE_DIN_PUBLISHABLE_KEY_HER

# Webhook Secret (kommer fra Stripe CLI senere)
STRIPE_WEBHOOK_SECRET=whsec_xxx

# =====================================================
# STRIPE PRICE IDS - UDFYLD DISSE!
# =====================================================

# Pay as you go (200 credits, 499 DKK, one-time)
STRIPE_PAYG_PRICE_ID=price_PASTE_PAYG_PRICE_ID_HER

# Pro Plan (400 credits/måned, 349 DKK/måned)
STRIPE_PRO_PRICE_ID=price_PASTE_PRO_PRICE_ID_HER

# Business Plan (1000 credits/måned, 699 DKK/måned)
STRIPE_BUSINESS_PRICE_ID=price_PASTE_BUSINESS_PRICE_ID_HER

# Boost 50 (50 credits, 99 DKK, one-time)
STRIPE_BOOST_50_PRICE_ID=price_PASTE_BOOST50_PRICE_ID_HER

# Boost 100 (100 credits, 159 DKK, one-time)
STRIPE_BOOST_100_PRICE_ID=price_PASTE_BOOST100_PRICE_ID_HER

# Boost 250 (250 credits, 199 DKK, one-time)
STRIPE_BOOST_250_PRICE_ID=price_PASTE_BOOST250_PRICE_ID_HER

# Boost 500 (500 credits, 249 DKK, one-time)
STRIPE_BOOST_500_PRICE_ID=price_PASTE_BOOST500_PRICE_ID_HER

# =====================================================
# REST AF FILEN (lad være som den er)
# =====================================================

# App Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Production URLs
NEXT_PUBLIC_APP_URL=https://app.rekruna.dk 

# Feature flags
NEXT_PUBLIC_ENABLE_ADMIN_CLEANUP=0

# Sentry (optional)
SENTRY_DSN=
# ... etc
```

---

## Step 5: Restart Dev Server

Efter du har udfyldt `.env.local`:

```bash
# Stop dev server (Ctrl+C i terminalen hvor den kører)
# Start igen:
npm run dev
```

---

## ✅ Verification Checklist

- [ ] `.env.local` fil oprettet
- [ ] `STRIPE_SECRET_KEY` udfyldt (sk_test_xxx)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` udfyldt (pk_test_xxx)
- [ ] Alle 7 Price IDs udfyldt (price_xxx)
- [ ] Dev server restartet

---

## 🐛 Troubleshooting

### Error: "Missing STRIPE_SECRET_KEY"
- Tjek at du har gemt `.env.local` filen
- Restart dev server

### Error: "Unknown price ID"
- Tjek at Price IDs matcher præcis (inkl. prefix `price_`)
- Ingen ekstra spaces eller quotes

### Kan ikke finde Price IDs
1. Gå til Product catalog
2. Klik på produktet
3. Scroll ned til "Pricing"
4. Kopier Price ID (ikke Product ID!)

---

## 📝 Eksempel På Korrekt Format

```bash
# KORREKT ✅
STRIPE_PAYG_PRICE_ID=price_1QK3vwFNrcZWLCHoWB5nDyiJ

# FORKERT ❌ (mangler price_ prefix)
STRIPE_PAYG_PRICE_ID=1QK3vwFNrcZWLCHoWB5nDyiJ

# FORKERT ❌ (har quotes)
STRIPE_PAYG_PRICE_ID="price_1QK3vwFNrcZWLCHoWB5nDyiJ"

# FORKERT ❌ (har spaces)
STRIPE_PAYG_PRICE_ID= price_1QK3vwFNrcZWLCHoWB5nDyiJ
```

---

## 🚀 Næste Step

Når `.env.local` er konfigureret:
➡️ **Test Stripe integration med Stripe CLI**

Se guide: `/documentation/PHASE2_TESTING_GUIDE.md`

