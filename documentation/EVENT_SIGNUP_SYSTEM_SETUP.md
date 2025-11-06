# 🎉 EVENT Signup System - Setup Guide

## 📋 Oversigt

EVENT signup systemet giver dig mulighed for at oprette demo konti til marketing kampagner. Demo konti har:
- 14 dages gratis adgang
- 100 credits (eller det du tildeler)
- Automatisk deaktivering efter udløb
- Manuel godkendelse af signups før aktivering

---

## 🚀 Deployment Steps

### 1. Database Migration

Kør database migration i Supabase SQL Editor:

```bash
database_migrations/add_event_signup_system.sql
```

Dette opretter:
- `pending_event_signups` tabel (gemmer signup anmodninger)
- Nye kolonner i `user_profiles` (account_type, event_signup_date, event_expiry_date, is_active)
- Automatisk trigger til at beregne expiry date

---

### 2. Environment Variables

Tilføj følgende til `.env.local` (development) og Vercel Environment Variables (production):

```bash
# Cron Job Secret (generer et langt random string)
CRON_SECRET=din_meget_lange_random_string_her
```

**Tip:** Generer et sikkert secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 3. Admin Access

Opdater admin email whitelist i følgende filer:

**app/api/admin/pending-signups/route.ts:**
```typescript
const adminEmails = [
  'jan@rekruna.dk',
  'support@rekruna.dk',
  // Tilføj flere admin emails her
]
```

**app/api/admin/approve-event-signup/route.ts:**
```typescript
const adminEmails = [
  'jan@rekruna.dk',
  'support@rekruna.dk',
]
```

---

### 4. Vercel Cron Job Setup

#### Vercel Hobby Plan

Cron job er **allerede konfigureret** i `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-event-accounts",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Schedule:** Kører dagligt kl. 02:00 UTC (03:00 dansk tid)

#### Post-Deployment

Efter du har deployed til Vercel:

1. Gå til Vercel Dashboard → Dit projekt → Settings → Cron Jobs
2. Verificer at cron jobbet vises og er enabled
3. Test manuelt ved at klikke "Run" knappen

**Alternativt:** Test lokalt:
```bash
curl http://localhost:3000/api/cron/expire-event-accounts \
  -H "Authorization: Bearer dit_cron_secret"
```

---

## 📱 URLs og Flow

### User URLs

- **Landing page:** `/event-signup`
- **Success page:** `/event-signup/pending`

### Admin URLs

- **Pending signups:** `/admin/pending-signups`

### API Endpoints

- `POST /api/event-signup/pending` - Opret pending signup
- `GET /api/admin/pending-signups` - Hent liste over pending signups
- `POST /api/admin/approve-event-signup` - Godkend signup
- `DELETE /api/admin/approve-event-signup?id=xxx` - Afvis signup
- `GET /api/cron/expire-event-accounts` - Deaktiver udløbne konti (Vercel Cron)

---

## 🔄 Bruger Flow

### 1. Signup Process

```
Kampagne → /event-signup 
  ↓
Udfylder formular (Firmanavn, Navn, Tlf, Email, Kodeord)
  ↓
Klik "Tilmeld" → Data gemmes i pending_event_signups
  ↓
Redirect til /event-signup/pending → "Afventer godkendelse"
```

### 2. Admin Godkendelse

```
Admin logger ind → /admin/pending-signups
  ↓
Ser liste over pending signups
  ↓
Klikker "Godkend (100 credits)"
  ↓
Backend:
  1. Opretter Supabase auth user
  2. Opretter user_profile (account_type = EVENT)
  3. Tildeler 100 credits
  4. Sender password reset email til bruger
```

### 3. Bruger Får Adgang

```
Bruger modtager email → "Sæt dit password"
  ↓
Klikker link → Sætter password
  ↓
Logger ind → Dashboard med EVENT banner
  ↓
Ser: "Du har X dage tilbage af demo"
  ↓
14 dage senere → Cron job deaktiverer konto
  ↓
Ved login: "Din demo er udløbet. Køb credits for at fortsætte"
```

---

## 🛠️ Admin Funktioner

### Godkend Signup

```typescript
POST /api/admin/approve-event-signup
Authorization: Bearer {admin_token}
Body: {
  "pendingId": "uuid",
  "credits": 100  // Valgfri, default 100
}
```

Dette:
- Opretter Supabase auth user
- Opretter user_profile med account_type = "EVENT"
- Sætter event_expiry_date til 14 dage frem
- Tildeler credits
- Sender password reset email
- Opdaterer pending signup til status "approved"

### Afvis Signup

```typescript
DELETE /api/admin/approve-event-signup?id={pendingId}
Authorization: Bearer {admin_token}
```

Dette:
- Opdaterer pending signup til status "rejected"
- Brugeren får aldrig adgang

---

## 🤖 Automatisk Deaktivering

### Cron Job

Kører **dagligt kl. 02:00 UTC** via Vercel Cron.

**Finder:**
- Alle EVENT konti hvor `event_expiry_date < NOW()`
- Kun konti der stadig er aktive (`is_active = true`)

**Deaktiverer:**
1. Sætter `is_active = false`
2. Sætter credits til 0
3. Logger transaction

**Efter deaktivering:**
- Brugeren kan stadig logge ind
- Dashboard viser "Din demo er udløbet" banner
- "Ny analyse" funktionalitet er blokeret
- Link til at købe credits

---

## 💳 EVENT → STANDARD Conversion

Når en EVENT kunde køber en pakke:

**Automatisk ved Stripe payment:**
1. Stripe webhook kalder `handleCheckoutCompleted`
2. Tjekker om `account_type = EVENT`
3. Opdaterer til `account_type = STANDARD`
4. Sætter `is_active = true`
5. Nulstiller `event_expiry_date`
6. Tildeler købte credits
7. Opretter Stripe customer record

**Resultat:**
- EVENT kunde bliver normal kunde
- Ingen 14-dages begrænsning mere
- Fuld adgang til alle features

---

## 📊 Database Struktur

### pending_event_signups

```sql
id UUID PRIMARY KEY
company_name TEXT
contact_name TEXT
phone TEXT (8 cifre)
email TEXT UNIQUE
password_hash TEXT (bcrypt)
campaign_source TEXT
status TEXT (pending/approved/rejected)
created_at TIMESTAMPTZ
```

### user_profiles (nye felter)

```sql
account_type TEXT DEFAULT 'STANDARD' (STANDARD eller EVENT)
event_signup_date TIMESTAMPTZ
event_expiry_date TIMESTAMPTZ (auto-beregnet: signup + 14 dage)
is_active BOOLEAN DEFAULT true
```

---

## 🧪 Testing

### 1. Test Signup Flow

```bash
# 1. Gå til http://localhost:3000/event-signup
# 2. Udfyld formular og submit
# 3. Verificer i Supabase at row er oprettet i pending_event_signups
```

### 2. Test Admin Godkendelse

```bash
# 1. Log ind som admin
# 2. Gå til http://localhost:3000/admin/pending-signups
# 3. Godkend en signup
# 4. Verificer i Supabase:
#    - user oprettes i auth.users
#    - user_profiles har account_type = EVENT
#    - credit_balances har 100 credits
```

### 3. Test Cron Job (Lokalt)

```bash
# Opret test EVENT kunde med expiry i fortiden
curl http://localhost:3000/api/cron/expire-event-accounts \
  -H "Authorization: Bearer ${CRON_SECRET}"

# Tjek response - skal vise antal deaktiverede konti
```

### 4. Test EVENT Banner på Dashboard

```bash
# 1. Log ind som EVENT kunde
# 2. Gå til /dashboard
# 3. Verificer at EVENT banner vises med dage tilbage
```

---

## 🚨 Troubleshooting

### Cron Job Kører Ikke

**Problem:** Vercel Cron job køres ikke.

**Løsning:**
1. Tjek Vercel Dashboard → Cron Jobs → Se logs
2. Verificer `vercel.json` er committed og deployed
3. Tjek `CRON_SECRET` er sat i Vercel Environment Variables
4. Vercel Hobby plan: Max 2 cron jobs dagligt

### Admin Kan Ikke Se Pending Signups

**Problem:** "Unauthorized - Admin access required"

**Løsning:**
1. Verificer din email er i admin whitelist
2. Tjek at du er logget ind
3. Tjek browser console for auth token errors

### EVENT Kunde Kan Ikke Logge Ind Efter Godkendelse

**Problem:** Bruger får "invalid password" efter godkendelse.

**Løsning:**
- Password reset email skal sendes
- Brugeren skal klikke link i email og sætte nyt password
- Tjek Supabase Logs for email delivery

### Dashboard Viser Ikke EVENT Banner

**Problem:** EVENT banner vises ikke selvom account_type = EVENT.

**Løsning:**
1. Åbn browser DevTools → Console
2. Tjek for errors i API kald til `/api/profile`
3. Verificer `event_expiry_date` er sat korrekt
4. Hard refresh (Ctrl+F5)

---

## 📝 Kampagne Tracking

### URL Parameters

Send kampagne data via URL params:

```
https://rekruna.dk/event-signup?campaign=linkedin-demo-jan-2025&utm_source=linkedin&utm_medium=cpc&utm_campaign=demo
```

**Gemmes automatisk i:**
- `campaign_source` - For nem filtrering i admin
- `utm_source`, `utm_medium`, `utm_campaign` - For analytics

### Admin Filtering

I `/admin/pending-signups`:

```typescript
GET /api/admin/pending-signups?campaign=linkedin-demo-jan-2025
```

Viser kun signups fra denne kampagne.

---

## 🎯 Best Practices

### 1. Kampagne Limits

Hvis kampagne har max antal (fx 10 signups):
1. Se antal i admin panel statistics
2. Godkend de X bedste baseret på firma/kvalitet
3. Afvis resten eller gem til senere

### 2. Credits Tildeling

Standard er 100 credits, men du kan justere:
```typescript
// Godkend med 50 credits
POST /api/admin/approve-event-signup
Body: { "pendingId": "xxx", "credits": 50 }

// Godkend med 200 credits
Body: { "pendingId": "xxx", "credits": 200 }
```

### 3. Opfølgning

Efter godkendelse:
1. Ring/email til kunden personligt
2. Book demo call hvis relevant
3. Følg op efter 7 dage
4. Påmind om udløb 2 dage før

---

## 🔐 Security Notes

- ✅ Admin endpoints tjekker email whitelist
- ✅ Cron job verificerer CRON_SECRET
- ✅ Password hashes med bcrypt
- ✅ RLS policies på alle tabeller
- ✅ Rate limiting via Vercel (automatisk)

---

## 📞 Support

Spørgsmål? Kontakt:
- Jan: jan@rekruna.dk
- Support: support@rekruna.dk

---

**Version:** 1.0  
**Dato:** 2025-01-06  
**Status:** ✅ Klar til deployment

