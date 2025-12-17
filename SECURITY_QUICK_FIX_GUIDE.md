# 🚨 REKRUNA SIKKERHEDSFIX - HURTIG GUIDE

**Tid:** ~15 minutter  
**Prioritet:** Høj - Udfør så hurtigt som muligt

---

## ✅ STEP 1: Fix Database Functions (5 min)

### Action:
Kør SQL fix i Supabase for at fjerne search_path sårbarhed

### Sådan gør du:

1. Åbn Supabase Dashboard
2. Gå til **SQL Editor**
3. Åbn filen: `database_migrations/fix_function_search_path_security.sql`
4. Kopier **hele** indholdet
5. Indsæt i SQL Editor
6. Klik **"Run"**

### Forventet resultat:
```
✅ All 7 database functions have been secured with explicit search_path!
```

### Verification:
Kør denne query i SQL Editor:
```sql
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
);
```

Du skal se `search_path_config` med værdi `{search_path=public,pg_temp}`

---

## ✅ STEP 2: Tilføj Admin Emails Environment Variable (2 min)

### Lokalt (.env.local):

```bash
# Tilføj denne linje til .env.local:
ADMIN_EMAILS=jan@rekruna.dk,support@rekruna.dk,janhojborghenriksen@gmail.com
```

### Production (Vercel):

```bash
# Via Vercel CLI:
vercel env add ADMIN_EMAILS

# Eller via Vercel Dashboard:
# 1. Gå til Project Settings
# 2. Environment Variables
# 3. Tilføj: ADMIN_EMAILS
# 4. Value: jan@rekruna.dk,support@rekruna.dk,janhojborghenriksen@gmail.com
# 5. Vælg: Production, Preview, Development
```

---

## ✅ STEP 3: Fix OTP Expiry i Supabase Auth (1 min)

### Action:
Reducer OTP token expiry fra 1 time til 10 minutter

### Sådan gør du:

1. Åbn Supabase Dashboard
2. Gå til **Authentication** → **Settings**
3. Find **"OTP Expiry"** eller **"Token Expiry"**
4. Sæt til **600** sekunder (10 minutter)
5. Klik **"Save"**

---

## ✅ STEP 4: Upgrade Postgres Database (5 min)

### Action:
Opdater database til nyeste version med security patches

### Sådan gør du:

1. **VIGTIGT: Backup først!**
   - Gå til **Database** → **Backups**
   - Klik **"Create Backup"**
   - Vent til backup er færdig

2. Gå til **Settings** → **Database**
3. Hvis der er en **"Upgrade Available"** knap, klik den
4. Følg upgrade wizard
5. Vent til upgrade er færdig (kan tage 5-10 min)

### Verification:
Kør i SQL Editor:
```sql
SELECT version();
-- Should show latest PostgreSQL version
```

---

## ✅ STEP 5: Redeploy Application (2 min)

### Action:
Deploy ændringerne til production

### Sådan gør du:

```bash
# I terminalen i projekt-mappen:
git add .
git commit -m "Security fixes: CSP headers, admin auth, database functions"
git push origin main

# Hvis du bruger Vercel CLI:
vercel --prod
```

### Verification:
1. Gå til din production URL: https://app.rekruna.dk
2. Åbn Browser DevTools (F12)
3. Tjek Console for CSP violations
4. Gå til Network tab → vælg en request → Headers
5. Verificer at disse headers er til stede:
   - `Content-Security-Policy`
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`

---

## ✅ STEP 6: Test Admin Authentication (1 min)

### Test at admin endpoints virker:

1. Login som admin bruger
2. Prøv at tilgå en admin side (fx pending signups)
3. Verificer at du får adgang

### Hvis der er problemer:

Tjek at `ADMIN_EMAILS` environment variable er sat korrekt:

```bash
# Lokalt:
echo $ADMIN_EMAILS

# Production (Vercel Dashboard):
# Settings → Environment Variables → Check ADMIN_EMAILS
```

---

## 🎉 FÆRDIG!

Alle kritiske sikkerhedsproblemer er nu fixed!

### Næste skridt:
- Læs den fulde sikkerhedsrapport: `SECURITY_REVIEW_2025.md`
- Implementer anbefalede forbedringer (ikke-kritiske)
- Setup monitoring alerts

---

## 🆘 PROBLEMER?

### Database function fix fejler:
- Tjek at du har adgang til SQL Editor
- Prøv at køre funktionerne én ad gangen
- Kontakt Supabase support hvis det fortsætter

### Admin emails virker ikke:
- Tjek spelling af email addresses (case-sensitive!)
- Verificer environment variable er deployed
- Restart Vercel deployment hvis nødvendigt

### CSP headers blokerer noget:
- Tjek browser console for CSP violations
- Tilføj manglende domains til CSP i `next.config.js`
- Test grundigt efter ændringer


