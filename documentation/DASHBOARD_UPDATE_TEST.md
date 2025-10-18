# Test Guide: Dashboard Opdateringer 🧪

**Dato:** 17. oktober 2025  
**Scope:** Dashboard med identisk credit boks som profilside

---

## Hvad er blevet ændret? ✨

1. ✅ **Velkomst header** med brugernavn fra profil
2. ✅ **Credit info boks** - nu 100% identisk med `/dinprofil`
3. ✅ **Quick stats** - 3 kort med analyser/credits info
4. ✅ **Forbedret seneste analyser** sektion
5. ✅ **Link til profilside** i header

---

## Test Scenarios 🎯

### Test 1: Credit Info Boks (Vigtigst!)
**Formål:** Verificer at credit boksen er identisk på både `/dashboard` og `/dinprofil`

**Steps:**
1. Log ind på din konto
2. Gå til `/dashboard`
3. Se på credit boksen (under velkommen header)
4. Gå til `/dinprofil`
5. Sammenlign credit boksen

**Forventet resultat:**
```
✅ Samme 3-kolonne layout
✅ Samme farver (grå, blå, grå)
✅ Samme boost knapper (50, 100, 250, 500)
✅ Samme "Betal" knap (rød)
✅ Samme font størrelser
✅ Samme spacing
```

**Screenshot sammenligning:**
- Tag screenshot af `/dashboard` credit boks
- Tag screenshot af `/dinprofil` credit boks
- De skal se 100% ens ud!

---

### Test 2: Boost Køb Flow
**Formål:** Test at boost køb virker korrekt

**Steps:**
1. Gå til `/dashboard`
2. Find credit boksen
3. Klik på "50" boost knappen
4. Verificer knappen bliver mørk (selected state)
5. Klik "Betal" knappen
6. Skal redirecte til Stripe Checkout

**Forventet resultat:**
```
✅ Boost knap highlightes når valgt
✅ "Betal" knap er enabled når boost valgt
✅ "Betal" knap er disabled når ingen boost valgt
✅ Redirects til Stripe ved klik på "Betal"
✅ Loading state vises under redirect
```

---

### Test 3: Velkomst Header
**Formål:** Test at brugernavn vises korrekt

**Steps:**
1. Gå til `/dinprofil`
2. Udfyld "Fulde navn" felt (f.eks. "Jan Højborg Henriksen")
3. Gem profil
4. Gå til `/dashboard`
5. Se på header

**Forventet resultat:**
```
✅ Header viser "Hej JAN" (fornavn i uppercase)
✅ Link til "Min Profil" synlig i højre side
✅ Hvis navn mangler: viser "Dashboard" i stedet
```

---

### Test 4: Quick Stats
**Formål:** Verificer at stats viser korrekte tal

**Steps:**
1. Gå til `/dashboard`
2. Se på de 3 stats kort under credit boksen

**Forventet resultat:**
```
✅ Kort 1: Viser antal analyser denne måned
✅ Kort 2: Viser credits brugt siden reset
✅ Kort 3: Viser credits tilbage
✅ Tal matcher med credit boksen
```

---

### Test 5: Seneste Analyser
**Formål:** Test forbedret analyser liste

**Hvis du har analyser:**
1. Gå til `/dashboard`
2. Scroll ned til "Seneste analyser"
3. Se på layout

**Forventet resultat:**
```
✅ Hver analyse har sin egen grå box
✅ Viser: titel, navn, dato og tidspunkt
✅ "Se rapport" knap for hver analyse
✅ Hover effect på boxes (bliver mørkere)
✅ Klik på "Se rapport" åbner PDF i ny tab
```

**Hvis du IKKE har analyser:**
```
✅ Viser: "Ingen analyser endnu"
✅ Hjælpsom tekst: "Start din første analyse..."
```

---

### Test 6: Real-time Opdatering
**Formål:** Test at stats opdateres efter analyse

**Steps:**
1. Gå til `/dashboard`
2. Noter credits tallet i credit boksen
3. Gennemfør en analyse (upload job + CVer)
4. Efter analyse færdig: gå tilbage til step 1
5. Se på credit boksen

**Forventet resultat:**
```
✅ Credits brugt er øget
✅ Credits tilbage er reduceret
✅ Analyser denne måned er øget med 1
✅ Seneste analyser liste opdateret
```

---

### Test 7: Responsive Design
**Formål:** Test på mobile/tablet

**Steps:**
1. Åbn `/dashboard` i browser
2. Åbn DevTools (F12)
3. Skift til mobile view (iPhone/Android)
4. Se på layout

**Forventet resultat:**
```
✅ Credit boks bliver 1 kolonne på mobile (stacker)
✅ Quick stats stacker vertikalt
✅ Boost knapper tilpasser sig
✅ Tekst forbliver læsbar
✅ Ingen horizontal scroll
```

---

### Test 8: Link Navigation
**Formål:** Test navigation mellem sider

**Steps:**
1. Start på `/dashboard`
2. Klik "Min Profil" link i header
3. Skal gå til `/dinprofil`
4. Fra profilside: klik "Start ny analyse" knap
5. Skal gå til `/dashboard`

**Forventet resultat:**
```
✅ Navigation virker begge veje
✅ Ingen page reload (Next.js Link)
✅ Data bevares (state persists korrekt)
```

---

## Edge Cases at teste 🔍

### Edge Case 1: Bruger uden profil
1. Ny bruger der lige har oprettet konto
2. Ikke udfyldt profil endnu
3. Gå til `/dashboard`

**Forventet:**
```
✅ Viser "Dashboard" i stedet for navn
✅ Credit boks viser korrekt (selvom plan mangler)
✅ Ingen fejl i console
```

---

### Edge Case 2: Bruger med 0 credits
1. Bruger der har brugt alle credits
2. Gå til `/dashboard`

**Forventet:**
```
✅ "Credits tilbage" viser 0
✅ Boost køb virker stadig
✅ Ingen negative tal
```

---

### Edge Case 3: Bruger uden aktiv subscription
1. Bruger der har aflyst subscription
2. Gå til `/dashboard`

**Forventet:**
```
✅ Plan viser "Ingen plan"
✅ Credit boks viser stadig korrekt
✅ Boost køb tilgængeligt
```

---

## Browser Compatibility 🌐

Test på følgende browsere:

- ✅ **Chrome** (seneste version)
- ✅ **Firefox** (seneste version)
- ✅ **Safari** (macOS/iOS)
- ✅ **Edge** (Chromium)

---

## Performance Tjek ⚡

**Load time:**
1. Åbn `/dashboard`
2. Mål tid fra klik til content vises

**Forventet:**
```
✅ Initial load: < 2 sekunder
✅ Data load: < 1 sekund
✅ Ingen layout shift
✅ Smooth transitions
```

---

## Database Queries 🗄️

For at verificere data integritet, tjek følgende:

**Supabase Dashboard:**
1. Gå til `credit_balances` tabel
2. Find din bruger
3. Sammenlign `total_credits` med dashboard

**Forventet:**
```
✅ Tal matcher nøjagtigt
✅ Transactions logges korrekt
✅ No orphaned records
```

---

## Console Tjek 🖥️

Åbn browser console (F12) under test:

**Forventet:**
```
✅ Ingen errors (røde beskeder)
✅ Max 1-2 warnings (gule)
✅ Network requests succeeder (200 status)
```

**Fejl du IKKE må se:**
```
❌ "Failed to fetch"
❌ "Unauthorized"
❌ "Cannot read property..."
❌ Database query errors
```

---

## Visual Regression 📸

Tag screenshots til sammenligning:

1. **Desktop view** (`/dashboard` - full width)
2. **Mobile view** (`/dashboard` - iPhone 12)
3. **Credit boks close-up** (begge sider)
4. **Seneste analyser** sektion

**Compare med profilside for konsistens!**

---

## Fejlfinding 🔧

### Problem: "Ingen plan" vises selvom jeg har plan
**Løsning:**
1. Tjek `user_subscriptions` tabel
2. Verificer status = 'active'
3. Tjek product_tier felt
4. Reload siden (Ctrl+F5)

### Problem: Credits tal ikke opdateres
**Løsning:**
1. Hard refresh (Ctrl+Shift+R)
2. Tjek browser console for errors
3. Verificer database queries
4. Log ud og ind igen

### Problem: Boost køb virker ikke
**Løsning:**
1. Tjek browser console
2. Verificer Stripe keys i `.env.local`
3. Tjek `/api/checkout` endpoint
4. Test i incognito mode

---

## Success Criterier ✅

Dashboard opdateringen er success hvis:

- ✅ Credit boks ser IDENTISK ud som på `/dinprofil`
- ✅ Alle stats viser korrekte tal
- ✅ Boost køb fungerer end-to-end
- ✅ Navigation mellem sider virker
- ✅ Responsive på alle devices
- ✅ Ingen console errors
- ✅ Real-time opdatering virker
- ✅ Loading states vises korrekt

---

## Næste Test Efter Deploy 🚀

Efter du har deployed til Vercel:

1. Test production URL
2. Verificer Stripe webhooks (live mode)
3. Test med rigtig betalings flow
4. Verificer database writes
5. Check Sentry for errors

---

## Kontakt 📞

Hvis du finder bugs eller har spørgsmål:
- Se DASHBOARD_IMPROVEMENTS.md for teknisk dokumentation
- Tjek browser console for fejl beskeder
- Noter steps to reproduce

**Held og lykke med testingen! 🎉**



