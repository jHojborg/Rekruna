# Upload Limits Configuration

## Overview
All file upload limits are centralized in `lib/constants.ts` for easy scaling and maintenance.

## Current Limits

### CV Upload Limits
```typescript
MAX_CV_COUNT: 50              // Max number of CVs per analysis
MAX_TOTAL_SIZE_MB: 25         // Max total size for all CVs combined
MAX_FILE_SIZE_MB: 5           // Max size per individual CV file
```

### Job Description Limits
```typescript
MAX_JOB_FILE_SIZE_MB: 10      // Max size for job description PDF
```

---

## Validation System

### Automatic Validation
The `uploadHelpers.validateFiles()` function checks:
1. **File Count:** Rejects if more than `MAX_CV_COUNT` files
2. **Total Size:** Rejects if combined size exceeds `MAX_TOTAL_SIZE_MB`
3. **Individual Size:** Rejects if any file exceeds `MAX_FILE_SIZE_MB`

### Error Messages
All error messages are user-friendly and in Danish:
- `"Max 50 CVer pr. analyse. Vælg færre filer."`
- `"Total filstørrelse må max være 25 MB. Aktuel: 30.5 MB"`
- `"'store_cv.pdf' er for stor (6.2 MB). Max 5 MB per fil."`

---

## How to Scale Up

### Option 1: Increase Max Count (Recommended)
**File:** `lib/constants.ts`

```typescript
export const UPLOAD_LIMITS = {
  MAX_CV_COUNT: 75,  // Changed from 50 → 75
  // ...rest unchanged
}
```

**Impact:**
- ✅ Users can upload 75 CVs instead of 50
- ⚠️ Processing time increases (~15 minutes for 75 CVs)
- ⚠️ Higher API costs (50% more OpenAI calls)

---

### Option 2: Increase Total Size
```typescript
export const UPLOAD_LIMITS = {
  MAX_TOTAL_SIZE_MB: 40,  // Changed from 25 → 40 MB
  // ...
}
```

**Use case:** Users have many large CV files (1+ MB each)

---

### Option 3: Both Count & Size
```typescript
export const UPLOAD_LIMITS = {
  MAX_CV_COUNT: 100,
  MAX_TOTAL_SIZE_MB: 50,
  // ...
}
```

**Use case:** Scale for enterprise clients with large recruitment drives

---

## Backend Considerations

### When Scaling Beyond 75 CVs:

#### 1. **API Route Timeout**
- Vercel has a **10-minute timeout** on hobby plan
- 75+ CVs may exceed this with SSE
- **Solution:** Implement batch processing (see below)

#### 2. **OpenAI Rate Limits**
- OpenAI has requests-per-minute limits
- 100+ CVs may trigger rate limiting
- **Solution:** Add retry logic with exponential backoff

#### 3. **Memory Management**
- Browser memory can struggle with 100+ files
- **Solution:** Process in batches, clear memory between batches

#### 4. **Cost Control**
- More CVs = higher costs
- **Solution:** Consider tiered pricing or per-CV billing

---

## Testing Recommendations

### Before Increasing Limits:

1. **Load Test:**
   ```bash
   # Test with 75 CVs (each ~500KB)
   # Measure: processing time, memory usage, error rate
   ```

2. **Monitor Costs:**
   - Track OpenAI API usage
   - Calculate cost per CV
   - Project monthly costs at new limits

3. **UX Testing:**
   - Is 15+ minute wait acceptable?
   - Does progress bar keep users engaged?
   - Should we add "pause/resume" functionality?

---

## Future: Batch Processing (For 100+ CVs)

### Architecture (Not yet implemented)
```typescript
const BATCH_SIZE = 25

async function analyzeBatches(cvFiles: File[]) {
  const batches = chunk(cvFiles, BATCH_SIZE)
  
  for (const batch of batches) {
    await analyzeViaSse(batch)
    // Wait between batches to avoid rate limits
    await sleep(2000)
  }
}
```

### Benefits:
- ✅ No hard limit on CV count
- ✅ Better error recovery (failed batch can be retried)
- ✅ Avoids timeout issues
- ✅ More controlled API usage

### Trade-offs:
- ⚠️ More complex code
- ⚠️ Longer total processing time (pauses between batches)
- ⚠️ UI needs to show multi-batch progress

---

## Monitoring & Analytics

### Track These Metrics:
1. **Average CVs per analysis**
   - If most users submit 10-15 CVs, 50 is plenty
   - If many hit the 50 limit, consider increasing

2. **Failed uploads due to limits**
   - Count: "Max 50 CVer" errors
   - Count: "Total filstørrelse" errors

3. **Processing time distribution**
   - Median, 95th percentile
   - Track if timeouts occur

4. **User feedback**
   - Support tickets about limits
   - Feature requests for higher limits

---

## Related Files
- `lib/constants.ts` - Main configuration
- `components/dashboard/CVUploadCard.tsx` - Uses validation
- `app/(dashboard)/dashboard/page.tsx` - Uses validation
- `app/api/analyze/route.ts` - Backend processing
- `app/api/analyze/stream/route.ts` - SSE backend

---

## Decision Log

### 2024 - Initial Launch
- **Limit:** 50 CVs
- **Rationale:** 
  - Good balance of UX (10 min processing)
  - Manageable API costs
  - Covers 90% of use cases
  - Easy to scale up based on feedback

### Future Changes
_Document any limit increases here with date and reasoning_



