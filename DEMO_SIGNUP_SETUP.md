# 🎯 Demo Signup System - Setup Guide

## 📋 Oversigt

Vi har bygget en komplet demo signup landingsside på `/demo-signup` hvor besøgende fra marketing kampagner kan tilmelde sig en demo af Rekruna.

---

## ✅ Hvad Er Bygget

### 1. **Database Tabel: `demo_leads`**

Ny tabel i Supabase til at gemme alle demo signups.

#### Felter:
- `id` - UUID (auto-genereret)
- `company_name` - Firmanavn (påkrævet)
- `contact_name` - Kontaktpersons fulde navn (påkrævet)
- `phone` - Telefonnummer (påkrævet)
- `email` - Email adresse (påkrævet, unique)
- `best_day` - Træffes bedst dag (fritext)
- `best_time` - Træffes bedst tidspunkt (fritext)
- `utm_source`, `utm_medium`, `utm_campaign` - Marketing tracking
- `referrer` - Hvor kom de fra?
- `status` - Lead status: `new`, `contacted`, `qualified`, `converted`, `rejected`
- `notes` - Admin noter om leadet
- `created_at`, `updated_at`, `contacted_at` - Timestamps

**Migration fil:** `database_migrations/add_demo_leads_table.sql`

---

### 2. **Frontend: `/demo-signup` Side**

Responsive landingsside med formular.

#### Features:
- ✅ Professionel headline og brødtekst
- ✅ 6 påkrævede formular felter
- ✅ Client-side validering (email format, telefon, alle felter)
- ✅ Loading state under submission
- ✅ Toast notifications for feedback
- ✅ "Tak" besked på samme side efter submission
- ✅ Samme design som kontakt siden (brand-base, hvid card, skygge)

**Fil:** `app/demo-signup/page.tsx`

---

### 3. **API Endpoint: `/api/demo-signup`**

Backend endpoint der håndterer formular submissions.

#### Funktioner:
1. **Validering** - Server-side validering af alle felter
2. **Gem i Supabase** - Indsætter lead i `demo_leads` tabel
3. **Send Email** - Sender notification til `support@rekruna.dk` med alle detaljer
4. **UTM Tracking** - Gemmer UTM parametre for marketing tracking
5. **Error Handling** - Håndterer duplicates og andre fejl

**Fil:** `app/api/demo-signup/route.ts`

---

## 🚀 Setup Instruktioner

### Trin 1: Kør Database Migration

1. Log ind i Supabase dashboard
2. Gå til **SQL Editor**
3. Åbn filen `database_migrations/add_demo_leads_table.sql`
4. Kopier hele indholdet
5. Indsæt i SQL Editor og klik **Run**
6. Verificer at tabellen er oprettet:

```sql
SELECT * FROM demo_leads LIMIT 1;
```

### Trin 2: Verificer Environment Variables

Tjek at følgende er sat i `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=re_your_resend_api_key
```

### Trin 3: Test Lokalt

1. Start development serveren:
   ```bash
   npm run dev
   ```

2. Åbn browseren: [http://localhost:3000/demo-signup](http://localhost:3000/demo-signup)

3. Udfyld formularen med test data:
   - **Firmanavn:** Test Firma ApS
   - **Dit navn:** Jan Hansen
   - **Dit tel.nr:** 12345678
   - **Din e-mail:** test@example.com
   - **Træffes bedst dag:** Mandag-onsdag
   - **Træffes bedst tidspunkt:** Mellem 9-12

4. Klik **"Send anmodning"**

5. Verificer:
   - ✅ Du ser "Tak" beskeden
   - ✅ Du modtager email på `support@rekruna.dk`
   - ✅ Lead er gemt i Supabase

### Trin 4: Tjek Supabase

Verificer at leadet er gemt:

```sql
SELECT * FROM demo_leads ORDER BY created_at DESC LIMIT 5;
```

---

## 📧 Email Format

Emails til `support@rekruna.dk` indeholder:

### Header
- **Subject:** `🎯 Ny Demo Anmodning - [Firmanavn]`
- **From:** Rekruna Demo Signup <noreply@rekruna.dk>
- **Reply-To:** Lead's email (så I kan svare direkte)

### Indhold
1. **Firma Information** (grå box)
   - Firmanavn
   - Kontaktperson
   - Email (klikbar link)
   - Telefon (klikbar link)

2. **Bedste Kontakttid** (blå box)
   - Træffes bedst dag
   - Træffes bedst tidspunkt

3. **Kampagne Tracking** (gul box - hvis UTM parametre findes)
   - UTM Source
   - UTM Medium
   - UTM Campaign
   - Referrer

4. **Næste Skridt** (info box)
   - Forslag til opfølgning

---

## 🎯 Marketing Kampagne Integration

### URL med UTM Tracking

For at tracke marketing kampagner, send trafik til:

```
https://rekruna.dk/demo-signup?utm_source=linkedin&utm_medium=cpc&utm_campaign=demo-jan-2025
```

UTM parametre gemmes automatisk i `demo_leads` tabellen.

### Eksempel Kampagne URL'er:

**LinkedIn Ads:**
```
/demo-signup?utm_source=linkedin&utm_medium=cpc&utm_campaign=demo-jan-2025
```

**Facebook Ads:**
```
/demo-signup?utm_source=facebook&utm_medium=paid-social&utm_campaign=demo-jan-2025
```

**Email Kampagne:**
```
/demo-signup?utm_source=newsletter&utm_medium=email&utm_campaign=demo-jan-2025
```

**Google Ads:**
```
/demo-signup?utm_source=google&utm_medium=cpc&utm_campaign=demo-jan-2025
```

---

## 📊 Lead Management

### Se Alle Leads

```sql
SELECT 
  company_name,
  contact_name,
  email,
  phone,
  status,
  created_at
FROM demo_leads
ORDER BY created_at DESC;
```

### Se Nye (Ukontaktede) Leads

```sql
SELECT * FROM demo_leads 
WHERE status = 'new' 
ORDER BY created_at DESC;
```

### Opdater Lead Status

Når I har kontaktet et lead:

```sql
UPDATE demo_leads 
SET 
  status = 'contacted',
  contacted_at = NOW(),
  notes = 'Telefonsamtale - interesseret i Pro plan'
WHERE email = 'lead@example.com';
```

### Lead Status Værdier

- `new` - Ny signup (default)
- `contacted` - I har kontaktet leadet
- `qualified` - Leadet er kvalificeret (seriøs interesse)
- `converted` - Leadet er blevet kunde
- `rejected` - Leadet er ikke relevant

---

## 🔒 Sikkerhed

### RLS (Row Level Security)
- ✅ Tabellen har RLS enabled
- ✅ Ingen public access - kun via service role
- ✅ API bruger `supabaseAdmin` for at bypasse RLS

### Data Validering
- ✅ Client-side validering (instant feedback)
- ✅ Server-side validering (security)
- ✅ Email format check
- ✅ Telefonnummer length check
- ✅ Duplicate email check (unique constraint)

### Email Sikkerhed
- ✅ RESEND_API_KEY aldrig exposed til klienten
- ✅ Lazy initialization (kun når API kaldes)
- ✅ Error handling hvis email fejler

---

## 🧪 Testing Checklist

### Før Deployment

- [ ] Database tabel oprettet i Supabase
- [ ] Environment variables sat korrekt
- [ ] Test formular lokalt
- [ ] Verificer email modtages på support@rekruna.dk
- [ ] Tjek at lead gemmes i Supabase
- [ ] Test validering (tomme felter, ugyldig email, kort telefon)
- [ ] Test duplicate email (skal give fejl)
- [ ] Test UTM tracking (med URL parametre)
- [ ] Test responsive design (mobil)

### Test Cases

#### Test 1: Happy Path
1. Gå til `/demo-signup`
2. Udfyld alle felter korrekt
3. Submit
4. **Forventet:** Tak besked + email + lead i database

#### Test 2: Validering
1. Prøv at submit uden at udfylde felter
2. **Forventet:** Fejlbesked "Udfyld venligst alle felter"

#### Test 3: Ugyldig Email
1. Indtast ugyldig email (fx "test@")
2. Submit
3. **Forventet:** Fejlbesked "Indtast venligst en gyldig email"

#### Test 4: For Kort Telefon
1. Indtast telefon med kun 5 cifre
2. Submit
3. **Forventet:** Fejlbesked om telefonnummer

#### Test 5: Duplicate Email
1. Submit formular med en email der allerede eksisterer
2. **Forventet:** Fejlbesked "Denne email er allerede registreret..."

#### Test 6: UTM Tracking
1. Gå til `/demo-signup?utm_source=test&utm_campaign=test123`
2. Submit formular
3. Tjek database at UTM parametre er gemt

---

## 🎨 Design Specifikationer

### Farver
- Background: `bg-brand-base` (hero section)
- Card: Hvid med `shadow-[4px_6px_16px_rgba(0,0,0,0.25)]`
- Primary button: `primary-600` / `primary-700`
- Error: `red-500`

### Layout
- Max width: `max-w-2xl` (formular container)
- Padding: `p-8` (card)
- Spacing: `space-y-6` (formular felter)

### Responsivt
- ✅ Mobile-first design
- ✅ Padding justeres automatisk (px-4 sm:px-6 lg:px-8)
- ✅ Form felter tager fuld bredde (w-full)

---

## 📈 Næste Skridt

### Umiddelbart
1. Kør database migration i Supabase
2. Test lokalt med test data
3. Verificer email modtagelse
4. Deploy til produktion

### Fremtidige Forbedringer (valgfrit)
- [ ] Admin dashboard til at se alle leads
- [ ] Email notifications til salg team
- [ ] CRM integration (fx HubSpot)
- [ ] A/B testing af forskellige headlines
- [ ] Lead scoring baseret på firma størrelse
- [ ] Auto-responder email til leadet
- [ ] Google Analytics event tracking

---

## 🐛 Fejlfinding

### Email sendes ikke
- Tjek at `RESEND_API_KEY` er sat i `.env.local`
- Tjek at domænet `rekruna.dk` er verificeret i Resend
- Tjek server logs for Resend fejlbeskeder

### Lead gemmes ikke i database
- Tjek at `SUPABASE_SERVICE_ROLE_KEY` er sat
- Tjek at `demo_leads` tabellen eksisterer
- Tjek Supabase logs for fejl

### Formular viser ikke
- Tjek at `/demo-signup/page.tsx` eksisterer
- Tjek console for JavaScript fejl
- Verificer at `Button` component importeres korrekt

### Validering virker ikke
- Tjek browser console for fejl
- Verificer at alle form felter har `required` attribut
- Tjek at `name` attributter matcher state keys

---

## 📞 Support

Har du spørgsmål eller problemer?

- 📧 Email: support@rekruna.dk
- 📱 Telefon: [Dit telefonnummer]
- 💬 Slack: #dev-support

---

**Bygget med** ❤️ **af din AI assistent**

Dato: November 2025
Version: 1.0

