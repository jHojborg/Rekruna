# Step 2: Credits Service - COMPLETE ✓

## 🎉 Hvad blev bygget

**Fil:** `/lib/services/credits.service.ts`

En komplet service til at håndtere alle credit operationer med 5 metoder:

---

## 📦 De 3 Vigtige Metoder

### 1. `hasEnoughCredits(userId, amount)`
**Formål:** Tjek om bruger har råd til at analysere CVs

**Input:**
- `userId` - Brugerens ID
- `amount` - Antal credits nødvendige (typisk = antal CVs)

**Output:**
```typescript
{
  success: true,
  data: {
    hasCredits: true/false,
    currentBalance: 700,
    subscriptionCredits: 400,
    purchasedCredits: 300,
    required: 50,
    shortfall: 0  // Antal credits der mangler (0 hvis nok)
  }
}
```

**Hvornår bruges:**
- FØR analysis starter
- For at vise bruger hvor mange credits de har
- For at blokkere analysis hvis ikke nok credits

---

### 2. `deductCredits(userId, analysisId, amount)`
**Formål:** Træk credits FØR analysis starter

**Input:**
- `userId` - Brugerens ID
- `analysisId` - Unikt ID for denne analysis (til audit trail)
- `amount` - Antal credits at trække

**Output:**
```typescript
{
  success: true,
  data: {
    deducted: 50,
    balanceAfter: 650,
    transactions: [
      { creditType: 'subscription', amount: 50 }
    ]
  }
}
```

**Forretningslogik:**
1. ✅ Tjek om nok credits (fejl hvis ikke)
2. ✅ Træk fra `subscription_credits` FØRST
3. ✅ Træk fra `purchased_credits` hvis nødvendigt
4. ✅ Opdater `credit_balances` tabel
5. ✅ Log transaktioner i `credit_transactions`

**Eksempel - Simpel deduction:**
```
Balance før: subscription=400, purchased=300
Træk 50 credits
Balance efter: subscription=350, purchased=300
```

**Eksempel - Kompleks deduction:**
```
Balance før: subscription=30, purchased=100
Træk 50 credits
Resultat: Træk 30 fra subscription, 20 fra purchased
Balance efter: subscription=0, purchased=80
```

---

### 3. `refundAnalysis(userId, analysisId, amount, reason)`
**Formål:** Refunder credits hvis analysis fejler

**Input:**
- `userId` - Brugerens ID
- `analysisId` - Den analysis der fejlede
- `amount` - Antal credits at refundere
- `reason` - Hvorfor (f.eks. "OpenAI API timeout")

**Output:**
```typescript
{
  success: true,
  data: {
    refunded: 50,
    balanceAfter: 700,
    originalTransactions: [
      { creditType: 'subscription', amount: 30 },
      { creditType: 'purchased', amount: 20 }
    ]
  }
}
```

**Forretningslogik:**
1. ✅ Find original deduction transactions via `analysisId`
2. ✅ Refunder i SAMME fordeling som blev trukket
3. ✅ Opdater `credit_balances`
4. ✅ Log refund transaktioner

**Eksempel:**
```
Original deduction: 30 subscription + 20 purchased
Refund: Giv 30 tilbage til subscription, 20 til purchased
```

---

## 🎁 Bonus Helper Metoder

### 4. `initializeBalance(userId)`
**Formål:** Opret credit balance for ny bruger

```typescript
await CreditsService.initializeBalance(newUserId)
// Opretter credit_balances record med 0 credits
```

**Bruges når:**
- Ny bruger sign up
- Sikrer at bruger har en balance record

---

### 5. `getBalance(userId)`
**Formål:** Hent brugerens nuværende balance

```typescript
const result = await CreditsService.getBalance(userId)
// { success: true, data: { totalCredits: 700, ... }}
```

**Bruges til:**
- Vise balance i dashboard
- Hurtig balance check uden kompleks logik

---

## 🔑 Nøgle Features

### ✅ Success/Error Pattern
**INGEN thrown errors** - alle metoder returnerer objekter:

```typescript
// Success
{ success: true, data: { ... }}

// Error
{ success: false, error: "Error message" }
```

**Hvorfor?**
- Nemmere at håndtere fejl
- Mere forudsigelig kode
- Bedre for debugging

---

### ✅ Deduction Priority Logic
**Subscription credits bruges ALTID først:**

```typescript
// Balance: subscription=100, purchased=200
// Deduct 150 credits

// Step 1: Brug alle 100 subscription credits
// Step 2: Brug 50 af purchased credits
// Resultat: subscription=0, purchased=150
```

**Hvorfor?**
- Subscription credits udløber månedligt
- Purchased credits er lifetime
- Maksimer værdi for brugeren

---

### ✅ Fuld Audit Trail
**Hver operation logges i `credit_transactions`:**

```typescript
{
  user_id: 'xxx',
  amount: -50,              // Negativ for deduction
  balance_after: 650,       // Total efter transaction
  credit_type: 'subscription',
  transaction_type: 'deduction',
  analysis_id: 'analysis_123',
  description: 'Deducted 50 credits...',
  created_at: '2025-01-15...'
}
```

**Benefits:**
- Se historik for hver bruger
- Track hvad hver analysis kostede
- Debugging og support
- Fraud detection senere

---

## 📝 Kode Kvalitet

### Kommentarer
- ✅ Hver metode har forklaring
- ✅ Business rules er dokumenteret
- ✅ Trin-for-trin logik beskrevet
- ✅ Simple sætninger (som requested)

### Type Safety
- ✅ TypeScript interfaces for alle responses
- ✅ Klare type definitions
- ✅ Ingen `any` types

### Error Handling
- ✅ Validering af alle inputs
- ✅ Database fejl håndteres
- ✅ Klare fejlbeskeder
- ✅ Try-catch blokke overalt

---

## 🧪 Test Det

### Quick Test
1. Opret `/app/api/test-credits/route.ts` (se testing guide)
2. Start server: `npm run dev`
3. Åbn: `http://localhost:3000/api/test-credits?userId=YOUR_USER_ID`
4. Tjek console output

### Manual Test i Supabase
```sql
-- Efter at have kaldt service metoder, tjek:
SELECT * FROM credit_balances WHERE user_id = 'xxx';
SELECT * FROM credit_transactions WHERE user_id = 'xxx' ORDER BY created_at DESC;
```

**Detaljeret guide:** Se `/documentation/credits_service_testing.md`

---

## 📊 Eksempel Workflow

```typescript
// 1. Bruger vil analysere 50 CVs
const check = await CreditsService.hasEnoughCredits(userId, 50)

if (!check.success) {
  return { error: check.error }  // Database fejl
}

if (!check.data.hasCredits) {
  return { 
    error: 'Not enough credits',
    shortfall: check.data.shortfall  // Vis hvor mange de mangler
  }
}

// 2. Træk credits FØR analysis
const deduct = await CreditsService.deductCredits(userId, analysisId, 50)

if (!deduct.success) {
  return { error: deduct.error }
}

// 3. Prøv at analysere
try {
  const results = await analyzeWithOpenAI(cvs)
  return { success: true, results }
} catch (error) {
  // 4. Fejl? Refunder credits!
  await CreditsService.refundAnalysis(
    userId, 
    analysisId, 
    50, 
    `Analysis failed: ${error.message}`
  )
  throw error
}
```

---

## ✅ Step 2 Checklist

- [x] ✅ Credits Service oprettet
- [x] ✅ 3 hoved-metoder implementeret
- [x] ✅ 2 helper-metoder tilføjet
- [x] ✅ Success/error pattern brugt
- [x] ✅ Deduction priority logic korrekt
- [x] ✅ Fuld transaction logging
- [x] ✅ Type-safe interfaces
- [x] ✅ Error handling overalt
- [x] ✅ Detaljerede kommentarer
- [x] ✅ Ingen linter errors
- [x] ✅ Test guide oprettet

---

## 🚀 Næste Step

**Når du har testet Credits Service:**

Tell me: **"Credits Service virker ✓"**

➡️ **Derefter:** Phase 3 - Integrate med `/app/api/analyze/route.ts`

Vi tilføjer:
- Credit check FØR analysis
- Deduct credits FØR OpenAI calls
- Auto-refund hvis fejl

**UDEN at ødelægge eksisterende functionality!** 🎯

---

## 📚 Filer Oprettet

```
lib/services/
  └─ credits.service.ts          ← Den vigtige fil!

documentation/
  ├─ credits_service_testing.md  ← Hvordan man tester
  └─ STEP2_SUMMARY.md            ← Du er her
```

**Alt klar til test!** 🎉





