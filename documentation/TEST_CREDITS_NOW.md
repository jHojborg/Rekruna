# 🧪 Test Credits Service NU

## Hurtig Start (3 minutter)

### Step 1: Start Dev Server
```bash
npm run dev
```

### Step 2: Åbn Test URL

Brug din user ID fra tidligere test (fra Supabase):
```
http://localhost:3000/api/test-credits?userId=5c29101c-b27e-4d6b-b695-cd879fe75aa9
```

**Husk:** Erstat `5c29101c-b27e-4d6b-b695-cd879fe75aa9` med din egen user ID!

### Step 3: Tjek Resultaterne

**I Browser:**
- Ser JSON response med alle test resultater
- Se summary: antal tests passed/skipped/failed

**I Terminal/Console:**
- Se detaljeret output for hver test
- Se hvilket credit type blev brugt
- Se balance før/efter hver operation

---

## Hvad Tester Det?

Test API kører **6 automatiske tests:**

### ✅ Test 1: Get Current Balance
- Henter brugerens nuværende credits
- Hvis ikke fundet → initialiserer balance automatisk

### ✅ Test 2: Check Credits (50 CVs)
- Tjekker om bruger har råd til 50 CVs
- Viser current balance og shortfall

### ✅ Test 3: Deduct 50 Credits
- Trækker 50 credits fra balance
- Viser hvilken credit type blev brugt (subscription/purchased)
- Springer over hvis ikke nok credits

### ✅ Test 4: Get Balance After Deduction
- Verificerer at balance blev opdateret korrekt
- Sammenligner med forventet værdi

### ✅ Test 5: Refund 50 Credits
- Refunderer de 50 credits (simulerer fejlet analysis)
- Viser at credits blev tilbageført

### ✅ Test 6: Final Balance Check
- Verificerer at balance er tilbage til original værdi
- Bekræfter at refund virkede

---

## Forventet Output (Console)

```
========================================
🧪 CREDITS SERVICE TEST STARTED
👤 User ID: 5c29101c-b27e-4d6b-b695-cd879fe75aa9
========================================

📊 TEST 1: Get Current Balance
─────────────────────────────────────
✅ Success!
   Subscription Credits: 400
   Purchased Credits: 300
   Total Credits: 700

🔍 TEST 2: Check Credits (50 CVs needed)
─────────────────────────────────────
✅ Success!
   Has Enough? YES ✓
   Current Balance: 700
   Required: 50
   Shortfall: 0

💳 TEST 3: Deduct 50 Credits
─────────────────────────────────────
✅ Success!
   Deducted: 50
   New Balance: 650
   Transactions:
     - 50 from subscription

📊 TEST 4: Get Balance After Deduction
─────────────────────────────────────
✅ Success!
   Subscription Credits: 350
   Purchased Credits: 300
   Total Credits: 650

🔄 TEST 5: Refund 50 Credits
─────────────────────────────────────
✅ Success!
   Refunded: 50
   New Balance: 700
   Original Transactions:
     - 50 to subscription

📊 TEST 6: Final Balance Check
─────────────────────────────────────
✅ Success!
   Subscription Credits: 400
   Purchased Credits: 300
   Total Credits: 700

   ✅ Balance restored to original amount!

========================================
📋 TEST SUMMARY
========================================
✅ Tests Passed: 6
⏭️  Tests Skipped: 0
❌ Tests Failed: 0

🎯 Next Steps:
1. Check Supabase credit_balances table
2. Check Supabase credit_transactions table
3. Verify all transactions are logged
========================================
```

---

## Forventet Output (Browser JSON)

```json
{
  "success": true,
  "message": "Credits Service test complete",
  "userId": "5c29101c-b27e-4d6b-b695-cd879fe75aa9",
  "summary": {
    "testsPassed": 6,
    "testsSkipped": 0,
    "totalTests": 6
  },
  "results": {
    "test1_getBalance": { "success": true, "data": {...} },
    "test2_hasEnoughCredits": { "success": true, "data": {...} },
    "test3_deductCredits": { "success": true, "data": {...} },
    "test4_balanceAfterDeduct": { "success": true, "data": {...} },
    "test5_refundAnalysis": { "success": true, "data": {...} },
    "test6_finalBalance": { "success": true, "data": {...} }
  },
  "nextSteps": [
    "Check console logs above for detailed results",
    "Verify database tables in Supabase",
    ...
  ]
}
```

---

## Verificer i Supabase

### Check 1: Credit Balance
```sql
SELECT * FROM credit_balances 
WHERE user_id = '5c29101c-b27e-4d6b-b695-cd879fe75aa9';
```

**Forventet:**
- `subscription_credits`: 400 (tilbage til original)
- `purchased_credits`: 300 (uændret)
- `total_credits`: 700

### Check 2: Transaction History
```sql
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
LIMIT 5;
```

**Forventet (nyeste først):**
1. `refund` - +50 subscription (test refund)
2. `deduction` - -50 subscription (test analysis)
3. ... tidligere transactions fra Phase 1 tests

---

## Test Scenarier

### Scenario 1: User har nok credits (Normal)
**Balance:** 700 credits  
**Request:** 50 CVs  
**Resultat:**
- ✅ Test 2 → hasCredits: true
- ✅ Test 3 → Deducted 50 from subscription
- ✅ Test 4 → Balance: 650
- ✅ Test 5 → Refunded 50
- ✅ Test 6 → Balance: 700 (restored)

### Scenario 2: User har IKKE nok credits
**Balance:** 20 credits  
**Request:** 50 CVs  
**Resultat:**
- ✅ Test 2 → hasCredits: false, shortfall: 30
- ⏭️ Test 3 → Skipped (insufficient credits)
- ⏭️ Test 5 → Skipped (no deduction to refund)

### Scenario 3: Complex Deduction (Priority Test)
**Balance:** 30 subscription + 100 purchased  
**Request:** 50 CVs  
**Resultat:**
- ✅ Test 3 → 
  - Deducted 30 from subscription
  - Deducted 20 from purchased
  - Total: 50 deducted
- ✅ Test 5 → 
  - Refunded 30 to subscription
  - Refunded 20 to purchased

---

## Hvis Noget Fejler

### Error: "User credit balance not found"
**Fix:** Test API initialiserer automatisk, men hvis det fejler:
```sql
INSERT INTO credit_balances (user_id, subscription_credits, purchased_credits)
VALUES ('YOUR_USER_ID', 400, 300);
```

### Error: "Missing userId parameter"
**Fix:** Husk at tilføje `?userId=XXX` til URL

### Error: Database connection failed
**Fix:** Tjek at:
- Supabase credentials er korrekte i `.env.local`
- `SUPABASE_SERVICE_ROLE_KEY` er sat
- Database tabeller eksisterer

---

## Success Checklist

Efter test, verificer:

- [ ] ✅ Alle 6 tests passed
- [ ] ✅ Console viser detaljeret output
- [ ] ✅ Browser viser success JSON
- [ ] ✅ Supabase credit_balances har korrekt balance
- [ ] ✅ Supabase credit_transactions har nye entries
- [ ] ✅ Deduction brugte subscription credits først
- [ ] ✅ Refund genoprettede exact balance

---

## Når Tests Passer

**Fortæl mig:**
"Credits Service tests passed ✅"

**Derefter:**
- Slet test API: `/app/api/test-credits/route.ts` (midlertidig fil)
- Gå til **Phase 3**: Integrate med `/app/api/analyze/route.ts`

---

## TL;DR - Quick Commands

```bash
# 1. Start server
npm run dev

# 2. Åbn browser
http://localhost:3000/api/test-credits?userId=YOUR_USER_ID

# 3. Tjek console output

# 4. Verificer i Supabase
SELECT * FROM credit_balances WHERE user_id = 'YOUR_USER_ID';
SELECT * FROM credit_transactions WHERE user_id = 'YOUR_USER_ID' ORDER BY created_at DESC;
```

**Klar!** 🚀





