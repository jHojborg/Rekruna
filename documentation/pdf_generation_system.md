# PDF Generation System - React-PDF Implementation

## Overview
The application now uses React-PDF for generating professional CV analysis reports instead of the previous jsPDF implementation. This provides better design consistency, scalability, and maintainability.

## Architecture

### Components
- **`PdfReportTemplate.tsx`** - Main PDF template component matching design specifications
- **`lib/pdf/generator.ts`** - Utility functions for PDF generation and download
- **`lib/pdf/index.ts`** - Clean export structure

### Key Features
- **Alternating card backgrounds** - #f5f5f0 for odd candidates, white for even
- **Compact design** - Optimized typography and spacing
- **Professional table layout** - Dynamic column widths and proper alignment
- **Two-page structure** - Candidate cards on page 1, comparison table on page 2

## Usage

### Direct Download
```typescript
import { downloadAnalysisReportPdf } from '@/lib/pdf'

await downloadAnalysisReportPdf({ 
  results, 
  filename: 'cv-analyse-resultat.pdf' 
})
```

### Generate for Upload
```typescript
import { generatePdfForUpload } from '@/lib/pdf'

const blob = await generatePdfForUpload({ results })
// Upload blob to storage
```

## Design Specifications

### Typography
- **Title:** 20px, bold, center-aligned
- **Candidate names:** 14px, bold, left-aligned
- **Scores:** 12px, bold, #ff6f61 color
- **Section titles:** 12px, bold
- **List items:** 10px, normal

### Layout
- **Page margins:** 30px
- **Card padding:** 12px
- **Card spacing:** 12px between cards
- **Border weight:** 1px solid #000000

### Table Structure
- **Column 1 (#):** 8% width, center-aligned
- **Column 2 (Kandidat):** 25% width, left-aligned
- **Column 3 (Score):** 12% width, center-aligned
- **Columns 4+ (Requirements):** Remaining width distributed evenly

## Performance
- **Scalability:** Handles 20-30+ concurrent users
- **Memory efficient:** No browser engine overhead
- **Fast generation:** Direct PDF creation
- **Client-side capable:** Can generate in browser or server

## Migration from jsPDF
- Replaced 200+ lines of manual positioning code
- Improved design consistency and maintainability
- Better error handling and user feedback
- Maintained all existing functionality (download + Supabase upload)

## Future Enhancements
- Easy to add company logos
- Simple to modify layouts and styling
- Straightforward to add new sections or data
- Clean component structure for ongoing maintenance
