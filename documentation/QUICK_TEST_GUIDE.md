# 🚀 Quick Test Guide - 5 Minutter

## Start Her!

### 1. Tjek At Dev Server Kører
```bash
# Burde allerede køre på http://localhost:3001
# Hvis ikke:
npm run dev
```

---

### 2. Test Landing Page Pricing (30 sek)

1. Åbn http://localhost:3001
2. Scroll ned til "Simpel og transparent prissætning"
3. **Verificer:**
   - [ ] 3 pricing cards vises
   - [ ] Pay as you go: 499 kr
   - [ ] Pro Plan: 349 kr/måned (highlighted)
   - [ ] Business Plan: 699 kr/måned

---

### 3. Test Auth-Check (30 sek)

1. Klik "Start i dag" på Pay as you go
2. **Hvis ikke logged in:**
   - [ ] Du bliver redirected til signup
3. **Log ind eller opret konto**
4. Gå tilbage til http://localhost:3001/#pricing
5. Klik "Start i dag" igen
6. **Forventet:** 
   - [ ] Stripe Checkout åbner (eller fejl hvis .env.local ikke konfigureret)

---

### 4. Test Stripe Checkout (2 min)

**Forudsætning:** Du er logged in

1. Klik "Start i dag" på **Pay as you go**
2. **På Stripe Checkout siden:**
   - Email: Din email
   - Card: `4242 4242 4242 4242`
   - MM/YY: `12/34`
   - CVC: `123`
   - Navn: `Test Bruger`
   - Postal: `1234`
3. Klik "Pay"
4. **Forventet:**
   - [ ] Redirect til `/checkout/success`
   - [ ] "Bekræfter dit køb..." vises (2 sek)
   - [ ] Success besked med checkmark
   - [ ] "Gå til Dashboard" knap

---

### 5. Test Dashboard Credits (1 min)

1. Klik "Gå til Dashboard"
2. **Forventet:**
   - [ ] Credits Card vises øverst
   - [ ] Total Credits: 200
   - [ ] "Pay as you go" badge vises
   - [ ] CTA knap: "Opgrader til Pro eller Business..."

---

### 6. Test Top-Up (Kun Hvis Du Har Pro)

**Hvis du vil teste top-up:**
1. Køb Pro Plan først (gentag step 4 med Pro Plan)
2. Gå til Dashboard
3. **Forventet:**
   - [ ] Total Credits: 400
   - [ ] "Pro" badge
   - [ ] Top-up knapper vises (50, 100, 250, 500)
4. Klik på "50" knappen
5. **Forventet:**
   - [ ] Stripe Checkout åbner
6. Gennemfør betaling (test card igen)
7. **Forventet:**
   - [ ] Total Credits: 450 (400 subscription + 50 purchased)

---

### 7. Test Cancel Flow (30 sek)

1. Start en checkout (klik "Start i dag")
2. På Stripe Checkout: Klik "Back" i browseren
3. **Forventet:**
   - [ ] Redirect til `/checkout/cancel`
   - [ ] Cancel besked vises
   - [ ] Links tilbage til pricing

---

## ✅ Success Criteria

Hvis alle disse virker, er dit system **production-ready**! 🎉

- [ ] Pricing cards vises korrekt
- [ ] Auth-check virker (redirect til signup)
- [ ] Stripe Checkout åbner
- [ ] Test betaling går igennem
- [ ] Credits tilføjes i database
- [ ] Dashboard viser korrekt balance
- [ ] Success/cancel pages virker

---

## 🐛 Hvis Noget Fejler

### Error: "Missing STRIPE_SECRET_KEY"
➡️ Check `.env.local` er konfigureret korrekt

### Error: "Unknown price ID"
➡️ Check at Price IDs i `.env.local` matcher Stripe Dashboard

### Stripe Checkout Åbner Ikke
➡️ Check browser console (F12) for fejl

### Credits Vises Ikke
➡️ Check Supabase SQL Editor:
```sql
SELECT * FROM credit_balances;
SELECT * FROM credit_transactions;
```

### Webhook Virker Ikke
➡️ **Normal!** I lokal test bruges ikke webhooks endnu.
   Credits tilføjes når checkout succeeds (via metadata).
   Webhook test kræver Stripe CLI (kan skippes for nu).

---

## 💬 Næste Step

**Når basic test virker:**
- Prøv at analysere et CV → Se credits falde
- Test subscription reset (kræver manuel SQL)
- Test refund logic (simuler fejl i analyse)

**Eller:**
- Gå videre til production deployment! 🚀

See `/documentation/PHASE4_COMPLETE.md` for fuld guide.





