# Credits Service - Interface Design

## Return Pattern (Your Request)

All service methods return objects with this pattern:

```typescript
{
  success: boolean,
  error?: string,        // Only present if success = false
  data?: T,              // Only present if success = true
  details?: any          // Additional context (optional)
}
```

**Never throws errors** - always returns success/error objects.

---

## Service Methods (To Build in Step 2)

### 1. hasEnoughCredits()

**Purpose:** Check if user can afford to analyze CVs

**Signature:**
```typescript
async hasEnoughCredits(
  userId: string, 
  requiredAmount: number
): Promise<{
  success: true,
  data: {
    hasCredits: boolean,
    currentBalance: number,
    subscriptionCredits: number,
    purchasedCredits: number,
    required: number,
    shortfall: number // 0 if hasCredits = true
  }
} | {
  success: false,
  error: string
}>
```

**Example Usage:**
```typescript
const result = await CreditsService.hasEnoughCredits(userId, 50)

if (!result.success) {
  return { error: result.error }
}

if (!result.data.hasCredits) {
  return { 
    error: `Insufficient credits. Need ${result.data.required}, have ${result.data.currentBalance}` 
  }
}

// Proceed with analysis...
```

**Example Return (Success - Has Credits):**
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

**Example Return (Success - Insufficient Credits):**
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

**Example Return (Error - User Not Found):**
```json
{
  "success": false,
  "error": "User credit balance not found. Please contact support."
}
```

---

### 2. deductCredits()

**Purpose:** Deduct credits BEFORE analysis starts

**Signature:**
```typescript
async deductCredits(
  userId: string, 
  analysisId: string, 
  amount: number
): Promise<{
  success: true,
  data: {
    deducted: number,
    balanceAfter: number,
    transactions: Array<{
      creditType: 'subscription' | 'purchased',
      amount: number
    }>
  }
} | {
  success: false,
  error: string
}>
```

**Business Logic:**
1. Check if user has enough credits (fail if not)
2. Deduct from `subscription_credits` FIRST
3. If not enough, deduct remaining from `purchased_credits`
4. Log transaction(s) in `credit_transactions`
5. Update `credit_balances`

**Example Usage:**
```typescript
const result = await CreditsService.deductCredits(userId, 'analysis_123', 50)

if (!result.success) {
  return { error: result.error }
}

console.log(`Deducted ${result.data.deducted} credits`)
console.log(`New balance: ${result.data.balanceAfter}`)

// Proceed with OpenAI analysis...
```

**Example Return (Success - Simple Deduction):**
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

**Example Return (Success - Complex Deduction):**
User has 30 subscription + 100 purchased, needs 50:
```json
{
  "success": true,
  "data": {
    "deducted": 50,
    "balanceAfter": 80,
    "transactions": [
      {
        "creditType": "subscription",
        "amount": 30
      },
      {
        "creditType": "purchased",
        "amount": 20
      }
    ]
  }
}
```

**Example Return (Error - Insufficient Credits):**
```json
{
  "success": false,
  "error": "Insufficient credits. Required: 50, Available: 20"
}
```

---

### 3. refundAnalysis()

**Purpose:** Refund credits if analysis fails (auto-refund on errors)

**Signature:**
```typescript
async refundAnalysis(
  userId: string, 
  analysisId: string, 
  amount: number, 
  reason: string
): Promise<{
  success: true,
  data: {
    refunded: number,
    balanceAfter: number,
    originalTransactions: Array<{
      creditType: 'subscription' | 'purchased',
      amount: number
    }>
  }
} | {
  success: false,
  error: string
}>
```

**Business Logic:**
1. Find original deduction transaction(s) by `analysisId`
2. Refund credits in REVERSE order (purchased first, then subscription)
3. Log refund transaction(s)
4. Update `credit_balances`

**Example Usage:**
```typescript
try {
  // Attempt OpenAI analysis
  const analysisResult = await analyzeWithOpenAI(cvs)
  return analysisResult
} catch (error) {
  // Analysis failed - refund credits
  const refundResult = await CreditsService.refundAnalysis(
    userId, 
    analysisId, 
    50, 
    `OpenAI API error: ${error.message}`
  )
  
  if (!refundResult.success) {
    console.error('Refund failed:', refundResult.error)
    // Log to Sentry or monitoring system
  }
  
  throw error // Re-throw original error
}
```

**Example Return (Success - Simple Refund):**
Original deduction was 50 from subscription:
```json
{
  "success": true,
  "data": {
    "refunded": 50,
    "balanceAfter": 700,
    "originalTransactions": [
      {
        "creditType": "subscription",
        "amount": 50
      }
    ]
  }
}
```

**Example Return (Success - Complex Refund):**
Original deduction was 30 subscription + 20 purchased:
```json
{
  "success": true,
  "data": {
    "refunded": 50,
    "balanceAfter": 130,
    "originalTransactions": [
      {
        "creditType": "subscription",
        "amount": 30
      },
      {
        "creditType": "purchased",
        "amount": 20
      }
    ]
  }
}
```

**Example Return (Error - Transaction Not Found):**
```json
{
  "success": false,
  "error": "Original deduction transaction not found for analysis_id: analysis_123"
}
```

---

## Additional Helper Methods (Optional)

### getBalance()
Simple balance lookup (no complex logic)

```typescript
async getBalance(userId: string): Promise<{
  success: true,
  data: {
    subscriptionCredits: number,
    purchasedCredits: number,
    totalCredits: number,
    lastSubscriptionReset: string | null
  }
} | {
  success: false,
  error: string
}>
```

### initializeBalance()
Create credit balance for new user (auto-called on signup)

```typescript
async initializeBalance(userId: string): Promise<{
  success: true,
  data: {
    userId: string,
    initialBalance: 0
  }
} | {
  success: false,
  error: string
}>
```

---

## Error Handling Strategy

### Don't Throw - Return Errors
```typescript
// ❌ BAD - Throws error
async hasEnoughCredits(userId: string) {
  const balance = await getBalance(userId)
  if (!balance) throw new Error('User not found')
  return balance
}

// ✅ GOOD - Returns error
async hasEnoughCredits(userId: string) {
  const balance = await getBalance(userId)
  if (!balance) {
    return { 
      success: false, 
      error: 'User credit balance not found' 
    }
  }
  return { 
    success: true, 
    data: { hasCredits: true, ... } 
  }
}
```

### Common Error Scenarios

**1. User Not Found:**
```json
{ "success": false, "error": "User credit balance not found" }
```

**2. Database Error:**
```json
{ "success": false, "error": "Database error: [error details]" }
```

**3. Insufficient Credits:**
```json
{ "success": false, "error": "Insufficient credits. Required: 50, Available: 20" }
```

**4. Invalid Input:**
```json
{ "success": false, "error": "Invalid amount: must be greater than 0" }
```

**5. Transaction Not Found (Refund):**
```json
{ "success": false, "error": "Original transaction not found for analysis_id: xyz" }
```

---

## Database Transaction Pattern

All credit operations should use **database transactions** for atomicity:

```typescript
async deductCredits(userId: string, analysisId: string, amount: number) {
  // Start transaction
  const { data, error } = await supabase.rpc('deduct_credits_transaction', {
    p_user_id: userId,
    p_analysis_id: analysisId,
    p_amount: amount
  })
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true, data }
}
```

**Why?** Prevents race conditions:
- User A checks balance: 50 credits
- User B checks balance: 50 credits  
- Both deduct 50 credits → Should fail for one of them
- Transaction ensures only one succeeds

---

## Integration Example (Phase 3 Preview)

This is how it will integrate with `/app/api/analyze/route.ts`:

```typescript
export async function POST(req: Request) {
  // ... existing auth code ...
  
  const cvCount = cvFiles.length
  
  // ====== NEW: Check credits ======
  const checkResult = await CreditsService.hasEnoughCredits(userId, cvCount)
  
  if (!checkResult.success) {
    return NextResponse.json(
      { error: checkResult.error }, 
      { status: 500 }
    )
  }
  
  if (!checkResult.data.hasCredits) {
    return NextResponse.json(
      { 
        error: 'Insufficient credits',
        required: checkResult.data.required,
        available: checkResult.data.currentBalance,
        shortfall: checkResult.data.shortfall
      }, 
      { status: 402 } // Payment Required
    )
  }
  
  // ====== NEW: Deduct credits ======
  const deductResult = await CreditsService.deductCredits(
    userId, 
    analysisId, 
    cvCount
  )
  
  if (!deductResult.success) {
    return NextResponse.json(
      { error: deductResult.error }, 
      { status: 500 }
    )
  }
  
  // ====== EXISTING: Process CVs (wrapped for refund) ======
  try {
    const results = await analyzeWithOpenAI(cvFiles)
    return NextResponse.json({ results })
  } catch (error) {
    // ====== NEW: Refund on error ======
    await CreditsService.refundAnalysis(
      userId, 
      analysisId, 
      cvCount, 
      error.message
    )
    
    throw error
  }
}
```

---

## Testing the Service (Step 2)

Once we build the service, test like this:

```typescript
// Test 1: Check credits
const check = await CreditsService.hasEnoughCredits('user-123', 50)
console.log(check)

// Test 2: Deduct credits
const deduct = await CreditsService.deductCredits('user-123', 'analysis-1', 50)
console.log(deduct)

// Test 3: Refund credits
const refund = await CreditsService.refundAnalysis('user-123', 'analysis-1', 50, 'Test refund')
console.log(refund)
```

---

## Ready for Step 2?

Once Phase 1 database tests pass, tell me and I'll build this service with:
- ✅ All 3 methods with this exact interface
- ✅ Proper deduction priority (subscription first)
- ✅ Database transactions for atomicity
- ✅ No thrown errors - only returned objects
- ✅ Full transaction logging

🚀 Let me know when you're ready!






