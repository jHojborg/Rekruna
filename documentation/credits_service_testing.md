# Credits Service - Testing Guide

## ✅ Credits Service er bygget!

Du har nu:
- ✅ `/lib/services/credits.service.ts` med 5 metoder
- ✅ Success/error return pattern (ingen thrown errors)
- ✅ Deduction priority logic (subscription først, derefter purchased)
- ✅ Fuld transaction logging

---

## 📋 Metoder i Credits Service

### Hoved-metoder (De 3 vigtige):

1. **`hasEnoughCredits(userId, amount)`**
   - Checker om bruger har nok credits
   - Returnerer balance details og shortfall

2. **`deductCredits(userId, analysisId, amount)`**
   - Trækker credits FØR analysis
   - Følger priority rule (subscription → purchased)
   - Logger alle transaktioner

3. **`refundAnalysis(userId, analysisId, amount, reason)`**
   - Refunderer credits hvis analysis fejler
   - Finder original deduction og reverser den

### Helper-metoder (Bonus):

4. **`initializeBalance(userId)`**
   - Opretter credit balance for ny bruger
   - Starter med 0 credits

5. **`getBalance(userId)`**
   - Simpel balance lookup
   - Returnerer current credits

---

## 🧪 Test Credits Service

### Metode 1: API Route Test (Anbefalet)

Opret en test API endpoint så du kan teste service metoderne.

**Opret fil:** `/app/api/test-credits/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { CreditsService } from '@/lib/services/credits.service'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
  }

  try {
    // Test 1: Get Balance
    console.log('\n===== TEST 1: Get Balance =====')
    const balanceResult = await CreditsService.getBalance(userId)
    console.log('Balance result:', balanceResult)

    // Test 2: Check if user has enough credits for 50 CVs
    console.log('\n===== TEST 2: Check Credits (50 CVs) =====')
    const checkResult = await CreditsService.hasEnoughCredits(userId, 50)
    console.log('Check result:', checkResult)

    // Test 3: Deduct 50 credits
    if (checkResult.success && checkResult.data.hasCredits) {
      console.log('\n===== TEST 3: Deduct 50 Credits =====')
      const deductResult = await CreditsService.deductCredits(
        userId, 
        'test_analysis_' + Date.now(), 
        50
      )
      console.log('Deduct result:', deductResult)
    }

    // Test 4: Refund those 50 credits
    console.log('\n===== TEST 4: Refund Credits =====')
    const refundResult = await CreditsService.refundAnalysis(
      userId,
      'test_analysis_' + Date.now(),
      50,
      'Test refund - analysis simulation failed'
    )
    console.log('Refund result:', refundResult)

    return NextResponse.json({
      message: 'Credits Service test complete - check console logs',
      results: {
        balance: balanceResult,
        check: checkResult,
        refund: refundResult
      }
    })

  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
```

**Sådan tester du:**

1. Start din dev server: `npm run dev`
2. Åbn browser: `http://localhost:3000/api/test-credits?userId=5c29101c-b27e-4d6b-b695-cd879fe75aa9`
3. Tjek console logs i terminal
4. Tjek response i browser

---

### Metode 2: Direct Console Test

Åbn en Node.js REPL eller test direkte i en API route:

```typescript
import { CreditsService } from '@/lib/services/credits.service'

// Replace with your actual user ID
const userId = '5c29101c-b27e-4d6b-b695-cd879fe75aa9'

// Test 1: Get current balance
const balance = await CreditsService.getBalance(userId)
console.log('Balance:', balance)
// Expected: { success: true, data: { totalCredits: 700, ... }}

// Test 2: Check if user can analyze 50 CVs
const check = await CreditsService.hasEnoughCredits(userId, 50)
console.log('Has enough?', check)
// Expected: { success: true, data: { hasCredits: true, currentBalance: 700, ... }}

// Test 3: Deduct 50 credits
const deduct = await CreditsService.deductCredits(userId, 'analysis_123', 50)
console.log('Deducted:', deduct)
// Expected: { success: true, data: { deducted: 50, balanceAfter: 650, ... }}

// Test 4: Refund the 50 credits
const refund = await CreditsService.refundAnalysis(
  userId, 
  'analysis_123', 
  50, 
  'Test refund'
)
console.log('Refunded:', refund)
// Expected: { success: true, data: { refunded: 50, balanceAfter: 700, ... }}
```

---

## 📊 Expected Results

### Test 1: getBalance()

**Input:**
```typescript
await CreditsService.getBalance('5c29101c-b27e-4d6b-b695-cd879fe75aa9')
```

**Expected Output:**
```json
{
  "success": true,
  "data": {
    "subscriptionCredits": 400,
    "purchasedCredits": 300,
    "totalCredits": 700,
    "lastSubscriptionReset": null
  }
}
```

---

### Test 2: hasEnoughCredits()

**Input:**
```typescript
await CreditsService.hasEnoughCredits('user-id', 50)
```

**Expected Output (Has Credits):**
```json
{
  "success": true,
  "data": {
    "hasCredits": true,
    "currentBalance": 700,
    "subscriptionCredits": 400,
    "purchasedCredits": 300,
    "required": 50,
    "shortfall": 0
  }
}
```

**Expected Output (Insufficient):**
```json
{
  "success": true,
  "data": {
    "hasCredits": false,
    "currentBalance": 20,
    "subscriptionCredits": 0,
    "purchasedCredits": 20,
    "required": 50,
    "shortfall": 30
  }
}
```

---

### Test 3: deductCredits() - Simple

**Input:**
```typescript
await CreditsService.deductCredits('user-id', 'analysis_123', 50)
```

**Starting Balance:**
- subscription: 400
- purchased: 300
- total: 700

**Expected Output:**
```json
{
  "success": true,
  "data": {
    "deducted": 50,
    "balanceAfter": 650,
    "transactions": [
      {
        "creditType": "subscription",
        "amount": 50
      }
    ]
  }
}
```

**New Balance:**
- subscription: 350 (400 - 50)
- purchased: 300 (unchanged)
- total: 650

---

### Test 4: deductCredits() - Complex (Priority)

**Input:**
```typescript
await CreditsService.deductCredits('user-id', 'analysis_456', 450)
```

**Starting Balance:**
- subscription: 350
- purchased: 300
- total: 650

**Expected Output:**
```json
{
  "success": true,
  "data": {
    "deducted": 450,
    "balanceAfter": 200,
    "transactions": [
      {
        "creditType": "subscription",
        "amount": 350
      },
      {
        "creditType": "purchased",
        "amount": 100
      }
    ]
  }
}
```

**New Balance:**
- subscription: 0 (all used)
- purchased: 200 (300 - 100)
- total: 200

**✅ Priority rule verified:** Subscription credits used first!

---

### Test 5: refundAnalysis()

**Input:**
```typescript
await CreditsService.refundAnalysis(
  'user-id', 
  'analysis_456', 
  450, 
  'OpenAI API timeout'
)
```

**Starting Balance (after deduction):**
- subscription: 0
- purchased: 200
- total: 200

**Expected Output:**
```json
{
  "success": true,
  "data": {
    "refunded": 450,
    "balanceAfter": 650,
    "originalTransactions": [
      {
        "creditType": "subscription",
        "amount": 350
      },
      {
        "creditType": "purchased",
        "amount": 100
      }
    ]
  }
}
```

**New Balance (after refund):**
- subscription: 350 (0 + 350 refunded)
- purchased: 300 (200 + 100 refunded)
- total: 650

**✅ Credits restored to exact state before deduction!**

---

## 🔍 Verify in Supabase

Efter du har testet, tjek database:

```sql
-- Check balance
SELECT * FROM credit_balances 
WHERE user_id = '5c29101c-b27e-4d6b-b695-cd879fe75aa9';

-- Check transaction history
SELECT 
  transaction_type,
  credit_type,
  amount,
  balance_after,
  analysis_id,
  description,
  created_at
FROM credit_transactions 
WHERE user_id = '5c29101c-b27e-4d6b-b695-cd879fe75aa9'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:**
- Balance matches expected values
- All deductions and refunds are logged
- Transactions have correct analysis_id

---

## 🐛 Error Scenarios

### Error 1: Insufficient Credits

**Test:**
```typescript
// User has 200 credits, tries to deduct 300
const result = await CreditsService.deductCredits('user-id', 'test', 300)
```

**Expected:**
```json
{
  "success": false,
  "error": "Insufficient credits. Required: 300, Available: 200"
}
```

---

### Error 2: User Not Found

**Test:**
```typescript
const result = await CreditsService.getBalance('invalid-user-id')
```

**Expected:**
```json
{
  "success": false,
  "error": "User credit balance not found"
}
```

---

### Error 3: Invalid Amount

**Test:**
```typescript
const result = await CreditsService.hasEnoughCredits('user-id', -10)
```

**Expected:**
```json
{
  "success": false,
  "error": "Required amount must be greater than 0"
}
```

---

## ✅ Success Checklist

Run through these tests and verify:

- [ ] ✅ `getBalance()` returns correct credits
- [ ] ✅ `hasEnoughCredits()` correctly identifies if user can afford
- [ ] ✅ `deductCredits()` follows priority rule (subscription first)
- [ ] ✅ `deductCredits()` logs transactions correctly
- [ ] ✅ `deductCredits()` handles complex splits (subscription + purchased)
- [ ] ✅ `refundAnalysis()` restores exact amounts
- [ ] ✅ `refundAnalysis()` finds original transactions
- [ ] ✅ All methods return success/error pattern (no thrown errors)
- [ ] ✅ Database transactions are logged in `credit_transactions`
- [ ] ✅ Balance updates correctly in `credit_balances`

---

## 🚀 Next Steps

Once all tests pass:

1. ✅ **Tell me:** "Credits Service tests passed ✓"
2. ➡️ **Next:** We'll integrate this into `/app/api/analyze/route.ts` (Phase 3)

---

## 💡 Quick Test Command

Hurtigste måde at teste:

1. Opret `/app/api/test-credits/route.ts` (koden er ovenfor)
2. Start server: `npm run dev`
3. Åbn: `http://localhost:3000/api/test-credits?userId=YOUR_USER_ID`
4. Tjek console output

Eller bare fortæl mig når du vil gå videre! 🎯





