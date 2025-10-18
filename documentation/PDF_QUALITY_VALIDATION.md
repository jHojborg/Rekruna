# PDF Quality Validation System

## ⚠️ CURRENT STATUS: DISABLED

PDF validation is currently **DISABLED** (`ENABLED: false` in `lib/constants.ts`) due to being too aggressive with valid PDFs.

To re-enable later when improved, change `ENABLED: false` to `ENABLED: true`.

---

## Overview
Automatic validation of PDF files before upload to ensure quality, readability, and text content. Prevents upload of corrupted, image-only, or unreadable PDFs.

**Note:** This feature is currently disabled as it was rejecting too many valid PDFs.

---

## Features

### ✅ What We Check:

#### 1. **PDF Format Validation**
- Checks file signature (`%PDF-` magic bytes)
- Ensures file is actually a PDF
- **Error:** `"filename.pdf" er ikke en gyldig PDF fil. Vælg en korrekt PDF.`

#### 2. **Corruption Detection**
- Attempts to load PDF with PDF.js library
- Catches corrupted or damaged files
- **Error:** `"filename.pdf" er beskadiget og kan ikke læses. Upload venligst en anden fil.`

#### 3. **Page Count Check**
- Verifies PDF contains at least 1 page
- Rejects empty PDFs
- **Error:** `"filename.pdf" indeholder ingen sider. Upload en gyldig PDF.`

#### 4. **Text Content Validation** (Most Important!)
- Extracts text from first 3 pages
- Requires minimum 50 characters of text
- Detects image-only / scanned PDFs without OCR
- **Error:** `"filename.pdf" indeholder ingen tekst. PDF skal være tekstbaseret (ikke kun billeder).`

---

## User Experience

### Job Upload (Single File):
```
1. User selects PDF
2. Shows "Validerer PDF..." with spinner
3. If valid → Shows file preview
4. If invalid → Shows error alert
```

### CV Upload (Multiple Files):
```
1. User selects 10 CVs
2. Shows "Validerer CVer... (3/10)" with progress bar
3. Validates each file sequentially
4. If all valid → Shows file list
5. If any invalid → Shows list of failed files with reasons
```

---

## UI States

### Validating State:
```
┌─────────────────────────────────┐
│   🔄 (spinning)                 │
│   Validerer CVer...             │
│   Tjekker kvalitet og læsbarhed │
│   (3/10)                        │
│   ████████░░░░░░░░ 60%         │
└─────────────────────────────────┘
```

### Error State:
```
Alert popup:
┌──────────────────────────────────────────┐
│ Følgende filer kunne ikke valideres:    │
│                                          │
│ • Anders_CV.pdf: Indeholder ingen tekst │
│ • Maria_CV.pdf: Er beskadiget           │
│                                          │
│              [OK]                        │
└──────────────────────────────────────────┘
```

---

## Configuration

### Settings in `lib/constants.ts`:

```typescript
export const PDF_VALIDATION = {
  // Minimum text length (characters)
  MIN_TEXT_LENGTH: 50,
  
  // Pages to check for text
  PAGES_TO_CHECK: 3,
  
  // Enable/disable validation
  ENABLED: true,
}
```

### Adjust Settings:

**More lenient (faster, less strict):**
```typescript
MIN_TEXT_LENGTH: 20,      // Accept PDFs with less text
PAGES_TO_CHECK: 1,        // Only check first page (faster)
```

**More strict (slower, more thorough):**
```typescript
MIN_TEXT_LENGTH: 100,     // Require more text content
PAGES_TO_CHECK: 5,        // Check more pages
```

**Disable (not recommended):**
```typescript
ENABLED: false,           // Skip validation entirely
```

---

## Technical Implementation

### Files:
```
lib/pdf/validation.ts          - Core validation logic
lib/constants.ts               - Configuration
components/dashboard/
  ├─ JobUploadCard.tsx        - Job PDF validation
  └─ CVUploadCard.tsx         - CV PDFs validation
```

### Dependencies:
- **`pdfjs-dist`**: PDF parsing library (already installed)
- **Worker:** Loads from CDN automatically

### API:

#### Single File Validation:
```typescript
import { validatePdf } from '@/lib/pdf/validation'

const result = await validatePdf(file)
if (!result.valid) {
  alert(result.error)  // Show error to user
}
```

#### Multiple Files Validation:
```typescript
import { validatePdfs } from '@/lib/pdf/validation'

const result = await validatePdfs(files, (current, total) => {
  console.log(`Progress: ${current}/${total}`)
})

if (!result.valid) {
  // result.invalidFiles contains list of failed files
  result.invalidFiles.forEach(({ file, error }) => {
    console.log(`${file.name}: ${error}`)
  })
}
```

#### Job PDF Validation (Lenient):
```typescript
import { validateJobPdf } from '@/lib/pdf/validation'

const result = await validateJobPdf(file)
// More lenient - allows image-heavy PDFs
```

---

## Performance

### Single File:
- **Small PDF (1-2 pages):** ~200-500ms
- **Medium PDF (5-10 pages):** ~500-1000ms
- **Large PDF (20+ pages):** ~1-2 seconds
  - Only checks first 3 pages (configurable)

### Multiple Files:
- **10 CVs:** ~5-10 seconds total
- **50 CVs:** ~25-50 seconds total
- Progress bar keeps user informed

### Optimization:
- Sequential validation (one at a time)
- Only samples first N pages (default 3)
- Caches PDF.js worker

---

## Common Issues & Solutions

### Issue: "Indeholder ingen tekst"
**Cause:** Scanned PDF without OCR, or image-based PDF

**Solutions:**
1. Ask user to convert to text-based PDF
2. Use OCR software (Adobe Acrobat, online tools)
3. Recreate PDF from source document

**For Developers:**
- Reduce `MIN_TEXT_LENGTH` if too strict
- Check if PDF has extractable text layers

---

### Issue: "Er beskadiget"
**Cause:** Corrupted file, incomplete download, or non-PDF file renamed to .pdf

**Solutions:**
1. Re-download PDF
2. Open in PDF viewer to verify
3. Regenerate PDF from source

**For Developers:**
- Check browser console for detailed error
- May need manual inspection of file

---

### Issue: Validation Takes Too Long
**Performance Issues with 50+ CVs**

**Solutions:**
1. Reduce `PAGES_TO_CHECK` to 1 or 2
2. Implement parallel validation (complex)
3. Move validation to backend (API route)

**Backend Validation:**
```typescript
// app/api/validate-pdfs/route.ts
export async function POST(req: Request) {
  const formData = await req.formData()
  // Validate PDFs server-side
  // Return results
}
```

---

## Error Messages (Danish)

All error messages are user-friendly and in Danish:

| Error Type | Message |
|------------|---------|
| Invalid format | `"fil.pdf" er ikke en gyldig PDF fil. Vælg en korrekt PDF.` |
| Corrupted | `"fil.pdf" er beskadiget og kan ikke læses. Upload venligst en anden fil.` |
| No pages | `"fil.pdf" indeholder ingen sider. Upload en gyldig PDF.` |
| No text | `"fil.pdf" indeholder ingen tekst. PDF skal være tekstbaseret (ikke kun billeder).` |
| Unknown | `Kunne ikke validere "fil.pdf". Filen er muligvis beskadiget.` |

---

## Testing

### Manual Test Cases:

#### ✅ Valid PDFs:
- [ ] Text-based CV PDF
- [ ] Job description PDF with logos
- [ ] Multi-page CV (5+ pages)
- [ ] Small CV (1-2 pages)

#### ❌ Invalid PDFs:
- [ ] Corrupted PDF (damaged file)
- [ ] Image-only PDF (no text layer)
- [ ] Empty PDF (0 pages)
- [ ] Non-PDF file renamed to .pdf
- [ ] Scanned document without OCR

### Test Upload Flow:
1. Upload valid PDF → Should work ✅
2. Upload corrupted PDF → Should show error ❌
3. Upload image PDF → Should show "ingen tekst" ❌
4. Upload 10 valid CVs → Should show progress
5. Upload 10 CVs (1 invalid) → Should list the bad one

---

## Future Enhancements

### Optional Features (Not Yet Implemented):

1. **OCR Integration:**
   - Auto-detect image-only PDFs
   - Offer to convert with OCR
   - Use Tesseract.js or cloud OCR API

2. **Parallel Validation:**
   - Validate multiple files simultaneously
   - Faster for large batches
   - More complex implementation

3. **Backend Validation:**
   - Move heavy processing to server
   - Reduce client-side load
   - Better for slow connections

4. **Smart Sampling:**
   - Detect document type (CV vs cover letter)
   - Adjust validation rules accordingly
   - Check specific sections (e.g., contact info)

5. **Detailed Reports:**
   - Show text extraction preview
   - Indicate readability score
   - Warn about low-quality scans

---

## Related Files
- `lib/pdf/validation.ts` - Core validation logic
- `lib/constants.ts` - Configuration settings
- `components/dashboard/JobUploadCard.tsx` - Job PDF UI
- `components/dashboard/CVUploadCard.tsx` - CV PDFs UI
- `lib/pdf/index.ts` - PDF generation (separate)

## Related Documentation
- `FILE_PREVIEW_UI.md` - File preview system
- `UPLOAD_LIMITS_SCALING.md` - Upload limits config
- `ERROR_HANDLING_TOAST.md` - Error handling

