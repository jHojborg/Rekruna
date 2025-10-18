# How to Disable PDF Validation

If you're experiencing issues with PDF validation blocking valid files, you can easily disable it.

---

## Quick Fix: Disable Validation

**File:** `lib/constants.ts`

**Change this line:**
```typescript
ENABLED: true,  // ← Change this
```

**To:**
```typescript
ENABLED: false,  // ← Validation disabled
```

**Full code:**
```typescript
export const PDF_VALIDATION = {
  ENABLED: false,  // ⚠️ DISABLED - all PDFs will be accepted
  MIN_TEXT_LENGTH: 10,
  PAGES_TO_CHECK: 2,
} as const
```

---

## What Happens When Disabled?

✅ **All PDFs are accepted immediately**  
✅ **No loading spinner or validation delay**  
✅ **Works like before validation was added**  
❌ **No protection against corrupted files**  
❌ **No warning about image-only PDFs**

---

## Current Settings (Very Lenient)

The validation is already configured to be very tolerant:

```typescript
export const PDF_VALIDATION = {
  ENABLED: true,
  
  // Only requires 10 characters of text (very low)
  MIN_TEXT_LENGTH: 10,
  
  // Only checks first 2 pages (fast)
  PAGES_TO_CHECK: 2,
}
```

### What Gets Rejected (even with lenient settings):
- Files without PDF signature (`%PDF-` header)
- Files with 0 pages
- Files that are truly corrupted

### What Gets ALLOWED (even if not perfect):
- PDFs with minor parsing issues
- PDFs with very little text (10+ chars)
- PDFs that fail to load but have valid signature
- Image-heavy PDFs
- PDFs with unusual formatting

---

## Debugging Steps

### 1. Check Browser Console
When uploading a file, open browser DevTools (F12) and check Console for messages like:
```
✅ filename.pdf validated: 2 pages, 1234 chars
```
or
```
⚠️ filename.pdf failed signature check
```

### 2. Test with Known Good PDF
Try uploading a fresh PDF you just created:
- Export from Word/Google Docs as PDF
- Should work immediately

### 3. Check File Extension
Make sure file actually ends with `.pdf` (not `.PDF` or `.pdf.txt`)

---

## Gradually Re-enable (If Needed)

If you want some validation but less strict:

### Option 1: Only check file format
```typescript
export const PDF_VALIDATION = {
  ENABLED: true,
  MIN_TEXT_LENGTH: 0,  // Don't check text at all
  PAGES_TO_CHECK: 1,   // Minimal check
}
```

### Option 2: Signature check only
Modify `lib/pdf/validation.ts`:
```typescript
export async function validatePdf(file: File): Promise<PdfValidationResult> {
  if (!PDF_VALIDATION.ENABLED) {
    return { valid: true }
  }

  // Only check signature
  const hasValidSignature = await checkPdfSignature(file)
  if (!hasValidSignature) {
    return {
      valid: false,
      error: `"${file.name}" er ikke en gyldig PDF fil.`
    }
  }

  return { valid: true } // Skip all other checks
}
```

---

## Report Issues

If valid PDFs are still being rejected, please provide:
1. **Browser console logs** (F12 → Console)
2. **File name** that failed
3. **Error message** shown to user
4. **Sample PDF** (if possible)

This helps us improve the validation logic!

---

## Related Files
- `lib/constants.ts` - Enable/disable switch
- `lib/pdf/validation.ts` - Validation logic
- `components/dashboard/JobUploadCard.tsx` - Job upload
- `components/dashboard/CVUploadCard.tsx` - CV upload



