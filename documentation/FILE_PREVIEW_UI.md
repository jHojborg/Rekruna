# File Preview UI Implementation

## Overview
This document describes the file preview functionality added to the upload flow, providing users with clear visual feedback about their selected files.

## Features Implemented

### 1. Job Upload Preview (Step 1)
**File:** `components/dashboard/JobUploadCard.tsx`

#### Before Selection:
- Dashed border upload area
- "Klik for at vælge fil" prompt
- File size limit (10 MB) displayed

#### After Selection:
- **Header bar:** ✅ Checkmark + "Fil valgt" label
- **File card:**
  - 📄 File icon
  - File name (truncated if too long)
  - File size (formatted: B, KB, or MB)
  - ❌ Remove button (red hover effect)
- **"Vælg en anden fil" link:** Change file selection with upload icon

#### Features:
- PDF validation (only .pdf files allowed)
- Alert for invalid file types
- Clean, modern UI with hover effects
- Accessibility: proper button titles

---

### 2. CV Upload Preview (Step 3)
**File:** `components/dashboard/CVUploadCard.tsx`

#### Before Selection:
- Dashed border upload area
- "Klik for at vælge CV'er" prompt
- Multiple file selection supported (max 50)

#### After Selection:
- **Header bar:**
  - ✅ Checkmark + file count (e.g., "5 fil(er) valgt")
  - 🗑️ "Ryd alle" button (clears all files)

- **File list:**
  - Scrollable list (max height 400px)
  - Each file shows:
    - 📄 File icon
    - File name (truncated if needed)
    - File size (formatted)
    - ❌ Individual remove button
  - Hover effect on each file card

- **"Tilføj flere filer" button:**
  - Allows adding more files without replacing existing ones
  - Upload icon + underlined text

#### Features:
- PDF validation for all files
- Max 50 files limit
- Individual file removal
- Clear all functionality
- Scrollable list for many files
- File size formatting helper
- Responsive layout

---

## UX Improvements

### Visual Feedback
1. **Color coding:**
   - Green checkmark icon = File(s) selected
   - Red hover = Remove action
   - Gray borders/background = Neutral, clean look

2. **Icons:**
   - ✅ CheckCircle2 = File selected
   - ❌ X = Remove file
   - 📄 FileText = Individual file
   - 🗑️ Trash2 = Clear all
   - ⬆️ Upload = Add more

3. **Hover effects:**
   - Upload areas: `hover:bg-gray-50`
   - Remove buttons: `hover:bg-red-100` + red icon
   - Links: `hover:text-primary/80`

### User Control
- Easy file removal (both individual and bulk)
- Change selection without starting over
- Clear visual confirmation of selections
- File size visible before upload

### Accessibility
- Proper button `title` attributes
- Semantic HTML structure
- Clear visual hierarchy
- Keyboard-accessible buttons

---

## Technical Details

### File Size Formatting
```typescript
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
```

### Props Changes

#### JobUploadCard
**Before:**
```typescript
interface JobUploadCardProps {
  fileName?: string
  onFileSelected: (file: File) => void
  onStart: () => void
  canStart: boolean
}
```

**After:**
```typescript
interface JobUploadCardProps {
  file: File | null
  onFileSelected: (file: File) => void
  onStart: () => void
  canStart: boolean
}
```

#### CVUploadCard
**Before:**
```typescript
interface CVUploadCardProps {
  count: number
  onFilesSelected: (files: File[]) => void
  onAnalyze: () => void
  onBack: () => void
}
```

**After:**
```typescript
interface CVUploadCardProps {
  files: File[]
  onFilesSelected: (files: File[]) => void
  onAnalyze: () => void
  onBack: () => void
}
```

---

## Usage in Dashboard

### Job Upload (Step 1)
```tsx
<JobUploadCard 
  file={jobFile} 
  onFileSelected={(f) => setJobFile(f)} 
  onStart={startFromJob} 
  canStart={!!jobFile} 
/>
```

### CV Upload (Step 3)
```tsx
<CVUploadCard 
  files={cvFiles} 
  onFilesSelected={onFiles} 
  onAnalyze={analyze}
  onBack={goBackFromCVUpload}
/>
```

---

## Testing Checklist

### Job Upload
- [ ] Upload single PDF file
- [ ] View file name and size
- [ ] Remove file with X button
- [ ] Change file with "Vælg en anden fil"
- [ ] Try uploading non-PDF (should show alert)
- [ ] "Start Analyse" disabled when no file

### CV Upload
- [ ] Upload multiple PDF files (2-10)
- [ ] View all files in scrollable list
- [ ] Remove individual files
- [ ] "Ryd alle" clears all files
- [ ] "Tilføj flere filer" adds to existing
- [ ] Try uploading 51+ files (should show alert)
- [ ] Try uploading non-PDF (should show alert)
- [ ] Scroll works with 20+ files
- [ ] "Analyser CV'er" disabled when no files

---

## Future Enhancements (Optional)

1. **Drag & Drop:**
   - Allow users to drag files directly onto upload area
   - Visual feedback during drag hover

2. **File Thumbnails:**
   - Show PDF thumbnail previews
   - Requires additional library (e.g., `react-pdf`)

3. **Upload Progress:**
   - Show individual file upload progress
   - Useful for large files or slow connections

4. **File Validation:**
   - Check file size before upload
   - Preview first page of PDF
   - Validate PDF is not corrupted

5. **Sorting/Filtering:**
   - Sort files alphabetically
   - Search/filter in long lists
   - Group by file size

---

## Related Files
- `components/dashboard/JobUploadCard.tsx` - Job upload with preview
- `components/dashboard/CVUploadCard.tsx` - CV upload with list preview
- `app/(dashboard)/dashboard/page.tsx` - Main dashboard orchestration

## Related Documentation
- `ERROR_HANDLING_TOAST.md` - Error handling system
- `SSE_REAL_TIME_PROGRESS.md` - Real-time progress updates

