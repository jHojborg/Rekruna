# 🐛 BUGFIX: Forbedret Form Validering

**Dato:** 3. November 2025  
**Reporter:** Jan  
**Issue:** Brugere kunne udfylde signup form med kun mellemrum/tabs  
**Status:** ✅ FIXED

---

## 🔍 Problem Beskrivelse

Brugere kunne omgå mandatory fields i signup formen ved at taste kun mellemrum eller tabs.

### Hvordan Det Kunne Ske

**Før:**
```typescript
if (!form.companyName) e.companyName = 'Firmanavn er påkrævet'
```

Dette tjekker kun om feltet er "falsy" (tomt), men:
- `"   "` (mellemrum) = truthy ✅ Accepteret
- `"\t\t\t"` (tabs) = truthy ✅ Accepteret  
- `""` (tom string) = falsy ❌ Afvist

**Resultat:** Brugere kunne komme gennem signup med kun whitespace!

---

## ✅ Løsning Implementeret

### 1️⃣ Trim Whitespace Check

Tilføjet helper function der fjerner mellemrum før check:

```typescript
const isEmpty = (val: string) => !val || val.trim().length === 0
```

**Resultat:**
- `""` → tom → ❌ Afvist
- `"   "` → trim() → `""` → ❌ Afvist  
- `"Acme Corp"` → trim() → `"Acme Corp"` → ✅ Accepteret
- `"  Acme Corp  "` → trim() → `"Acme Corp"` → ✅ Accepteret

---

### 2️⃣ Type-Specifik Validering

#### 📝 Tekst Felter (Firmanavn, Adresse, By, Navn)

**Krav:**
- Må ikke være tomt (efter trim)
- Skal indeholde bogstaver (inkl. danske: æ, ø, å)

**Eksempler:**
```typescript
"   "          → ❌ Tom efter trim
"12345"        → ❌ Ingen bogstaver
"Acme Corp"    → ✅ OK
"H&M Danmark"  → ✅ OK (har bogstaver)
```

#### 🔢 CVR Nummer

**Krav:**
- Må ikke være tomt
- Kun tal (0-9)
- Præcis 8 cifre

**Eksempler:**
```typescript
"   "          → ❌ Tom
"ABC12345"     → ❌ Indeholder bogstaver
"1234567"      → ❌ Kun 7 cifre
"123456789"    → ❌ 9 cifre (for mange)
"12345678"     → ✅ OK (8 cifre)
```

**Note:** CVR validering mod CVR-register kommer senere.

#### 📮 Postnummer

**Krav:**
- Må ikke være tomt
- Kun tal (0-9)
- Præcis 4 cifre
- Mellem 1000 og 9999 (danske postnumre)

**Eksempler:**
```typescript
"   "          → ❌ Tom
"ABC1"         → ❌ Indeholder bogstaver
"123"          → ❌ Kun 3 cifre
"0999"         → ❌ Under 1000
"12345"        → ❌ 5 cifre
"8000"         → ✅ OK
"2100"         → ✅ OK
```

---

### 3️⃣ Data Trimming Før Submit

Når formen submittes, trimmes alle string fields:

```typescript
const cleanedData = {
  ...form,
  companyName: form.companyName.trim(),
  address: form.address.trim(),
  postalCode: form.postalCode.trim(),
  city: form.city.trim(),
  cvr: form.cvr.trim(),
  name: form.name.trim(),
  email: form.email.trim(),
  // password trimmes IKKE - whitespace kan være del af kodeord
}
```

**Hvorfor?**
- Fjerner utilsigtet whitespace fra start/slut
- Sikrer ren data i database
- Forhindrer problemer med sammenligning senere

---

## 📊 Før vs. Efter

| Input | Felt | Før | Efter |
|-------|------|-----|-------|
| `"   "` | Firmanavn | ✅ Accepteret | ❌ Afvist - Tom |
| `"123"` | Firmanavn | ✅ Accepteret | ❌ Afvist - Ingen bogstaver |
| `"ABC"` | CVR | ✅ Accepteret | ❌ Afvist - Skal være 8 tal |
| `"1234567"` | CVR | ✅ Accepteret | ❌ Afvist - Skal være 8 cifre |
| `"123"` | Postnr | ✅ Accepteret | ❌ Afvist - Skal være 4 cifre |
| `"0999"` | Postnr | ✅ Accepteret | ❌ Afvist - Skal være 1000-9999 |
| `"A"` | Navn | ✅ Accepteret | ❌ Afvist - Min. 2 tegn |
| `"Acme Corp"` | Firmanavn | ✅ Accepteret | ✅ Accepteret |
| `"12345678"` | CVR | ✅ Accepteret | ✅ Accepteret |
| `"8000"` | Postnr | ✅ Accepteret | ✅ Accepteret |

---

## 🎯 Validerings Regler (Komplet)

### Firmanavn
- ✅ Ikke tom
- ✅ Indeholder bogstaver
- ✅ Mellemrum i midten OK ("Acme Corporation")

### Adresse  
- ✅ Ikke tom
- ✅ Indeholder bogstaver

### Postnummer
- ✅ Ikke tom
- ✅ Kun tal
- ✅ Præcis 4 cifre
- ✅ Mellem 1000-9999

### By
- ✅ Ikke tom
- ✅ Indeholder bogstaver

### CVR
- ✅ Ikke tom
- ✅ Kun tal
- ✅ Præcis 8 cifre

### Fulde Navn
- ✅ Ikke tom
- ✅ Indeholder bogstaver
- ✅ Mindst 2 tegn

### Email
- ✅ Ikke tom
- ✅ Gyldig email format (xxx@xxx.xxx)

### Kodeord
- ✅ Mindst 8 tegn
- ✅ Store bogstaver (A-Z)
- ✅ Små bogstaver (a-z)
- ✅ Specialtegn (!@#$%^&* etc.)

---

## 🧪 Test Cases

### Test 1: Whitespace Only
```
Input: Alle felter med kun mellemrum "   "
Expected: Alle felter viser fejl "X er påkrævet"
Result: ✅ PASS
```

### Test 2: Invalid CVR
```
Input CVR: "ABC12345"
Expected: "CVR skal kun indeholde tal"
Result: ✅ PASS

Input CVR: "1234567" (7 cifre)
Expected: "CVR skal være 8 cifre"
Result: ✅ PASS
```

### Test 3: Invalid Postnummer
```
Input: "123"
Expected: "Postnummer skal være 4 cifre"
Result: ✅ PASS

Input: "0999"
Expected: "Postnummer skal være mellem 1000 og 9999"
Result: ✅ PASS
```

### Test 4: Valid Data
```
Firmanavn: "Acme Corporation"
Adresse: "Hovedgade 123"
Postnr: "8000"
By: "Aarhus"
CVR: "12345678"
Navn: "Jan Hansen"
Expected: Form submittes uden fejl
Result: ✅ PASS
```

---

## 🚀 Fremtidige Forbedringer

### Phase 2: CVR Validering
- [ ] Integration med CVR-register API
- [ ] Automatisk udfyldning af firmanavn fra CVR
- [ ] Check om CVR er aktivt

**Eksempel API:**
```typescript
const validateCVR = async (cvr: string) => {
  const response = await fetch(`https://cvrapi.dk/api?vat=${cvr}`)
  const data = await response.json()
  return data.name // Auto-fill company name
}
```

### Phase 3: Postnummer Validering
- [ ] Automatisk udfyldning af by fra postnummer
- [ ] Database med danske postnumre

**Eksempel:**
```typescript
const postalCodeMap = {
  "8000": "Aarhus C",
  "2100": "København Ø",
  // ...
}
```

### Phase 4: Internationale Kunder
- [ ] Support for udenlandske CVR (VAT numbers)
- [ ] Support for udenlandske postnumre
- [ ] Multi-format adresse validering

---

## 📋 Ændrede Filer

### Modified Files (1 total):
```
components/auth/SignupForm.tsx (+120 lines, improved validation)
```

---

## ✅ Summary

**Før:** Brugere kunne omgå validering med mellemrum  
**Efter:** Robust validering der tjekker både type og indhold  
**Impact:** Forhindrer ugyldige signups og sikrer data kvalitet  
**Risk:** Low - backwards compatible, kun strengere validering

**Alle eksisterende gyldige inputs virker stadig!** ✅





