# 🧪 Test Guide: Form Validering

**Hvordan teste den nye form validering**

---

## 🚀 Start Development Server

```bash
npm run dev
```

Gå til: http://localhost:3000/signup

---

## ✅ Test Cases At Køre Igennem

### Test 1: Whitespace Only (Skal Fejle)

**Udfyld alle felter med kun mellemrum:**
1. Firmanavn: `   ` (3 mellemrum)
2. Adresse: `   `
3. Postnummer: `   `
4. By: `   `
5. CVR: `   `
6. Navn: `   `
7. Email: `test@test.dk`
8. Password: `Test1234!`
9. Accepter betingelser: ✅

**Klik "Til betaling"**

**Forventet resultat:**
- ❌ Firmanavn: "Firmanavn er påkrævet"
- ❌ Adresse: "Adresse er påkrævet"
- ❌ Postnummer: "Postnummer er påkrævet"
- ❌ By: "By er påkrævet"
- ❌ CVR: "CVR er påkrævet"
- ❌ Navn: "Navn er påkrævet"

---

### Test 2: Kun Tal i Tekst Felter (Skal Fejle)

**Udfyld:**
1. Firmanavn: `12345`
2. Adresse: `123`
3. By: `999`
4. Navn: `789`

**Forventet resultat:**
- ❌ Firmanavn: "Firmanavn skal indeholde bogstaver"
- ❌ Adresse: "Adresse skal indeholde bogstaver"
- ❌ By: "By skal indeholde bogstaver"
- ❌ Navn: "Navn skal indeholde bogstaver"

---

### Test 3: Ugyldig CVR (Skal Fejle)

**Test A: Bogstaver i CVR**
- CVR: `ABC12345`
- Forventet: ❌ "CVR skal kun indeholde tal"

**Test B: For få cifre**
- CVR: `1234567` (7 cifre)
- Forventet: ❌ "CVR skal være 8 cifre"

**Test C: For mange cifre**
- CVR: `123456789` (9 cifre)
- Forventet: ❌ "CVR skal være 8 cifre"

**Test D: Gyldigt CVR** ✅
- CVR: `12345678`
- Forventet: ✅ Ingen fejl

---

### Test 4: Ugyldig Postnummer (Skal Fejle)

**Test A: Bogstaver**
- Postnummer: `ABC1`
- Forventet: ❌ "Postnummer skal kun indeholde tal"

**Test B: For få cifre**
- Postnummer: `123` (3 cifre)
- Forventet: ❌ "Postnummer skal være 4 cifre"

**Test C: Under 1000**
- Postnummer: `0999`
- Forventet: ❌ "Postnummer skal være mellem 1000 og 9999"

**Test D: Over 9999**
- Postnummer: `10000`
- Forventet: ❌ "Postnummer skal være 4 cifre"

**Test E: Gyldigt postnummer** ✅
- Postnummer: `8000`
- Forventet: ✅ Ingen fejl

---

### Test 5: For Kort Navn (Skal Fejle)

**Test A: 1 tegn**
- Navn: `A`
- Forventet: ❌ "Navn skal være mindst 2 tegn"

**Test B: 2 tegn** ✅
- Navn: `AB`
- Forventet: ✅ Ingen fejl

---

### Test 6: Gyldige Data (Skal Virke) ✅

**Udfyld med gyldige data:**
```
Firmanavn: Acme Corporation
Adresse: Hovedgade 123
Postnummer: 8000
By: Aarhus
CVR: 12345678
Navn: Jan Hansen
Email: test@test.dk
Password: Test1234!
Marketing: ☐ (valgfri)
Accepter betingelser: ✅
```

**Klik "Til betaling"**

**Forventet resultat:**
- ✅ Ingen fejlbeskeder
- ✅ Redirect til Stripe checkout

---

### Test 7: Mellemrum i Start/Slut (Skal Trimmes)

**Udfyld med mellemrum før/efter:**
```
Firmanavn: "  Acme Corporation  " (mellemrum i start/slut)
Adresse: "  Hovedgade 123  "
By: "  Aarhus  "
Navn: "  Jan Hansen  "
```

**Forventet resultat:**
- ✅ Accepteres (trimmes til korrekt format)
- ✅ Data gemmes uden ekstra mellemrum

**Hvordan verificere:**
1. Gennemfør signup
2. Check database (user_profiles tabel)
3. Verify at data er trimmet korrekt

---

### Test 8: Firmanavn Med Mellemrum (Skal Virke) ✅

**Test at mellemrum i MIDTEN bevares:**
```
Firmanavn: "H&M Danmark A/S"
Firmanavn: "Mærsk Shipping"
Firmanavn: "Bang & Olufsen"
```

**Forventet resultat:**
- ✅ Accepteres
- ✅ Mellemrum i midten bevares

---

### Test 9: Danske Tegn (Skal Virke) ✅

**Test med æ, ø, å:**
```
Firmanavn: "Søren & Søn ApS"
By: "København"
By: "Århus"
Navn: "Søren Jørgensen"
```

**Forventet resultat:**
- ✅ Accepteres
- ✅ Danske bogstaver genkendes korrekt

---

## 📊 Quick Checklist

Print denne og afkryds når testet:

- [ ] Test 1: Whitespace only → Afvist
- [ ] Test 2: Kun tal i tekst → Afvist
- [ ] Test 3A: CVR med bogstaver → Afvist
- [ ] Test 3B: CVR 7 cifre → Afvist
- [ ] Test 3C: CVR 9 cifre → Afvist
- [ ] Test 3D: CVR 8 cifre → Accepteret
- [ ] Test 4A: Postnr med bogstaver → Afvist
- [ ] Test 4B: Postnr 3 cifre → Afvist
- [ ] Test 4C: Postnr 0999 → Afvist
- [ ] Test 4E: Postnr 8000 → Accepteret
- [ ] Test 5A: Navn 1 tegn → Afvist
- [ ] Test 5B: Navn 2 tegn → Accepteret
- [ ] Test 6: Gyldige data → Redirect til Stripe
- [ ] Test 7: Trim whitespace → Data gemmes clean
- [ ] Test 8: Firmanavn med mellemrum → Mellemrum bevares
- [ ] Test 9: Danske tegn → Accepteres

---

## 🐛 Hvis Du Finder Fejl

1. Noter præcist hvilken test der fejler
2. Copy/paste input data
3. Copy/paste fejlbeskeden (eller mangel på fejl)
4. Screenshot hvis relevant
5. Send til udvikleren

---

## ✅ Success Kriterier

Alle test cases skal virke som beskrevet:
- Invalid inputs skal afvises med korrekt fejlbesked
- Valid inputs skal accepteres og submittes
- Data skal gemmes trimmet og clean i database










