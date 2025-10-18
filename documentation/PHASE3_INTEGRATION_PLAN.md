# Phase 3: Integration Plan - Credits → Analyze Route

## 🔍 Eksisterende Flow (Simplified)

```
1. Parse form data (line 596-599)
2. Extract analysisId, requirements (line 601-610)
3. Validate OpenAI API key (line 612-615)
4. ✅ AUTHENTICATION (line 617-627) ← userId extracted here
5. Rate limiting (line 629-635)
6. Extract job description (line 637-650)
7. Extract CV files (line 652-666)
8. PDF text extraction (line 700-719)
9. OpenAI processing (line 722-828) ← Main processing
10. Sort results (line 830-895)
11. Store in DB (line 902-921)
12. Return response (line 956-966)
```

---

## 🎯 Integration Points

### Point 1: Check Credits (After line 635)
**Location:** After rate limiting, before extraction  
**Why:** We have userId, we know CV count, haven't started processing yet

```typescript
// Line 636 - NEW: Check if user has enough credits
const cvCount = cvBlobs.length
const creditCheck = await CreditsService.hasEnoughCredits(userId, cvCount)

if (!creditCheck.success) {
  return NextResponse.json({ 
    ok: false, 
    error: creditCheck.error 
  }, { status: 500 })
}

if (!creditCheck.data.hasCredits) {
  return NextResponse.json({ 
    ok: false, 
    error: 'Insufficient credits',
    required: creditCheck.data.required,
    available: creditCheck.data.currentBalance,
    shortfall: creditCheck.data.shortfall
  }, { status: 402 }) // Payment Required
}
```

---

### Point 2: Deduct Credits (After line 666)
**Location:** After credit check, before processing starts  
**Why:** Deduct BEFORE work begins (business rule)

```typescript
// Line 667 - NEW: Deduct credits BEFORE processing
const deductResult = await CreditsService.deductCredits(userId, analysisId, cvCount)

if (!deductResult.success) {
  return NextResponse.json({ 
    ok: false, 
    error: deductResult.error 
  }, { status: 500 })
}

console.log(`💳 Deducted ${deductResult.data.deducted} credits for ${cvCount} CVs`)
```

---

### Point 3: Wrap Processing for Refund (Line 700-895)
**Location:** Wrap entire processing section  
**Why:** Auto-refund if anything fails

```typescript
// Line 700 - NEW: Wrap in try-catch for refund
try {
  // ... existing PDF extraction code (line 700-719)
  // ... existing OpenAI processing code (line 722-828)
  // ... existing sorting code (line 830-895)
} catch (processingError: any) {
  // NEW: Refund credits if processing failed
  console.error('❌ Processing failed, refunding credits:', processingError.message)
  
  const refundResult = await CreditsService.refundAnalysis(
    userId,
    analysisId,
    cvCount,
    `Analysis failed: ${processingError.message}`
  )
  
  if (!refundResult.success) {
    console.error('⚠️ Credit refund failed:', refundResult.error)
  } else {
    console.log(`✅ Refunded ${refundResult.data.refunded} credits`)
  }
  
  // Re-throw original error
  throw processingError
}
```

---

## 📋 Changes Summary

### Files to Modify:
1. `/app/api/analyze/route.ts` (1 file only!)

### Lines to Add:
- Import Credits Service at top (~line 5)
- Credit check after rate limiting (~line 636)
- Deduct credits before processing (~line 667)
- Try-catch wrapper around processing (~line 700-895)
- Refund logic in catch block

### Total New Lines: ~40 lines
### Existing Lines Changed: 0 (no modifications, only additions)

---

## ✅ Safety Measures

1. **No Breaking Changes:**
   - Only ADD code, don't modify existing logic
   - All existing functionality preserved
   - Rate limiting still works
   - Caching still works
   - Error handling still works

2. **Graceful Degradation:**
   - If credit check fails → Return 500 error
   - If deduct fails → Return 500 error
   - If refund fails → Log warning, continue throwing original error

3. **Business Logic:**
   - Check credits AFTER auth, BEFORE processing ✓
   - Deduct credits BEFORE OpenAI calls ✓
   - Auto-refund if processing fails ✓
   - No partial analysis (all-or-nothing) ✓

---

## 🧪 Test Plan

### Test 1: Normal Flow (User has credits)
```
1. User has 100 credits
2. Uploads 5 CVs
3. Credits checked → OK (100 >= 5)
4. Credits deducted → 95 left
5. Processing succeeds
6. Results returned
7. Credits remain: 95
```

### Test 2: Insufficient Credits
```
1. User has 2 credits
2. Uploads 5 CVs
3. Credits checked → FAIL (2 < 5)
4. Return 402 error with shortfall
5. No deduction happens
6. No processing happens
7. Credits remain: 2
```

### Test 3: Processing Fails (Refund)
```
1. User has 100 credits
2. Uploads 5 CVs
3. Credits checked → OK
4. Credits deducted → 95 left
5. Processing FAILS (e.g., OpenAI timeout)
6. Auto-refund triggered → 100 credits restored
7. Error returned to user
8. Credits remain: 100 (fully refunded)
```

### Test 4: Complex Deduction (Priority)
```
1. User has: 3 subscription + 100 purchased
2. Uploads 5 CVs
3. Deduction: 3 from subscription, 2 from purchased
4. Processing succeeds
5. Final balance: 0 subscription + 98 purchased
```

---

## 📝 Implementation Steps

1. ✅ Add import for Credits Service
2. ✅ Add credit check after rate limiting
3. ✅ Add deduct credits before processing
4. ✅ Wrap processing in try-catch
5. ✅ Add refund logic in catch
6. ✅ Test with Phase 1 test data
7. ✅ Verify in Supabase transactions

---

## 🚨 Edge Cases to Handle

### Edge Case 1: User has exactly enough credits
```
User has 5, needs 5 → Should work fine
```

### Edge Case 2: Concurrent requests
```
User has 10 credits, makes 2 requests for 5 CVs each at same time
→ Rate limiter prevents this (max 5 runs per 10 min)
→ Even if both pass rate limit, database transactions ensure atomicity
```

### Edge Case 3: Partial processing failure
```
5 CVs uploaded, 3 succeed, 2 fail
→ Currently handled by processWithConcurrency (returns null for failures)
→ Credits already deducted
→ No refund (processing completed, just with some failures)
→ This is CORRECT behavior (user uploaded 5, we attempted 5)
```

### Edge Case 4: Refund fails
```
Processing fails → refund attempted → refund fails
→ Log error but still throw original processing error
→ Manual intervention needed (customer support)
→ Transaction log will show deduction without refund
```

---

## 🎯 Ready to Implement?

When you approve, I will:
1. Modify `/app/api/analyze/route.ts`
2. Add ~40 lines of code with extensive comments
3. Show you the complete modified file
4. You can review changes before testing

**Skal jeg gå i gang?** 🚀





