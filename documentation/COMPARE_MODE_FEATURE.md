# 📊 Compare Mode - Multi-Analysis Comparison Feature

## Overview
Compare Mode gør det muligt at sammenligne resultater fra flere analyser af samme stilling, og generere en samlet rapport med alle kandidater sorteret efter score.

---

## ✅ Implementeret Funktionalitet

### 1. **Selection Interface** 
På `/dinprofil` siden kan brugere:
- Vælge 2-5 analyser via checkboxes
- Se valgte analyser markeret med blå baggrund
- Se antal valgte analyser i status bar
- Rydde valget med "Ryd valg" knap

### 2. **Validering**
- Minimum 2 analyser skal vælges
- Maximum 5 analyser kan vælges
- Checker om analyserne har samme krav
- Viser advarsel hvis krav er forskellige

### 3. **Backend API** (`/api/analyze/compare`)
- Henter multiple analyse resultater
- Kombinerer alle kandidater
- Sorterer efter total score (højeste først)
- Beregner score distribution
- Returnerer samlet data

### 4. **PDF Rapport Generering**
Samlet rapport indeholder:

**Side 1 - Oversigt:**
- Stillingsbetegnelse
- Total antal kandidater
- Antal analyser inkluderet
- Liste over inkluderede analyser (dato)
- Score fordeling (visual bar chart)

**Side 2+ - Alle Kandidater:**
- Sorteret efter score (højeste først)
- Kandidat navn + score
- Hvilken analyse kandidaten kommer fra
- Alle requirement scores
- CV resumé (hvis tilgængeligt)

---

## 🎯 Brugerflow

### Trin 1: Vælg Analyser
1. Gå til `/dinprofil`
2. Se "Seneste analyser" listen
3. Klik checkbox ved 2-5 analyser

### Trin 2: Kør Sammenligning
1. Klik "Sammenlign valgte" knap
2. Vent på backend processing

### Trin 3: Håndter Forskellige Krav (hvis relevant)
Hvis analyserne har forskellige krav:
- Modal vises med advarsel
- Viser krav for hver analyse
- Spørger: "Vil du stadig køre sammenligningen?"
- Bruger kan annullere eller fortsætte

### Trin 4: Download Rapport
- PDF genereres automatisk
- Downloades til brugerens enhed
- Filnavn: `{stillingsnavn}-samlet-analyse.pdf`
- Selection cleares automatisk

---

## 🔧 Teknisk Implementation

### Backend (`/api/analyze/compare/route.ts`)

**Input:**
```json
{
  "analysisIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Output (success):**
```json
{
  "ok": true,
  "comparison": {
    "totalCandidates": 25,
    "analysisCount": 3,
    "analyses": [
      {
        "id": "uuid1",
        "title": "Senior React Developer",
        "date": "2024-01-15"
      }
    ],
    "jobTitle": "Senior React Developer",
    "requirements": [...],
    "scoreDistribution": {
      "90-100%": 5,
      "80-89%": 8,
      "70-79%": 7,
      "60-69%": 3,
      "<60%": 2
    },
    "candidates": [
      {
        "name": "Kandidat A",
        "totalScore": 95,
        "requirements": [...],
        "resume": "...",
        "_analysisId": "uuid1",
        "_analysisTitle": "Senior React Developer",
        "_analysisDate": "2024-01-15"
      }
    ]
  }
}
```

**Output (warning - different requirements):**
```json
{
  "ok": true,
  "warning": "different_requirements",
  "message": "Analyserne har forskellige krav. Sammenligning kan være misvisende.",
  "analyses": [...]
}
```

### Frontend (`/dinprofil/page.tsx`)

**State:**
```typescript
const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([])
const [comparing, setComparing] = useState(false)
const [showDifferentRequirementsWarning, setShowDifferentRequirementsWarning] = useState(false)
const [pendingComparisonData, setPendingComparisonData] = useState<any>(null)
```

**Funktioner:**
- `toggleAnalysisSelection(analysisId)` - Toggle selection
- `handleCompareAnalyses()` - Kør comparison
- `proceedWithComparison()` - Fortsæt trods forskellige krav

### PDF Generation (`lib/pdf/compareReport.ts`)

Bruger `@react-pdf/renderer` til at generere rapport med:
- Multi-page layout
- Custom styling
- Visual score distribution bars
- Kandidat cards med farver

---

## 📋 Database Queries

### 1. Hent Analyse Metadata
```sql
SELECT analysis_id, title, requirements, created_at
FROM analysis_results
WHERE analysis_id IN ('uuid1', 'uuid2', ...)
  AND user_id = 'current_user_id'
```

### 2. Hent Cached Results
```sql
SELECT analysis_id, results
FROM analysis_cache
WHERE analysis_id IN ('uuid1', 'uuid2', ...)
```

---

## 🎨 UI/UX Features

### Visual Feedback
- ✅ Selected analyses har blå baggrund og border
- ✅ Status bar viser antal valgte
- ✅ Loading state under comparison
- ✅ Toast notifications for fejl/success
- ✅ Modal for warnings

### Disabled States
- Checkboxes disabled når 5 er valgt (kun de valgte kan de-selectes)
- "Sammenlign" knap disabled hvis < 2 valgt
- Alle knapper disabled under comparison

### Error Handling
- Ingen analyser valgt
- Kun 1 analyse valgt
- Analyser ikke fundet
- Forskellige krav warning
- PDF generation fejl

---

## 🚀 Future Enhancements (v1.1+)

### Suggested Improvements:
1. **Save Comparison Reports** - Gem i Supabase Storage for genvisning
2. **Email Reports** - Send direkte til email
3. **More Stats** - Average score, median, percentiles
4. **Filter Options** - Kun top 10, kun over 80%, etc.
5. **Template Matching** - Kun vis analyser med samme template
6. **Comparison History** - Se tidligere sammenligninger

### Nice-to-have:
- Export til Excel/CSV
- Side-by-side requirement comparison
- Duplicate candidate detection (samme person i flere analyser)
- Batch operations (sammenlign alle analyser fra sidste måned)

---

## 🧪 Testing Guide

### Test Scenarie 1: Normal Comparison (samme krav)
1. Lav 3 analyser med samme job template
2. Gå til `/dinprofil`
3. Vælg alle 3 analyser
4. Klik "Sammenlign valgte"
5. ✅ PDF downloades automatisk

### Test Scenarie 2: Different Requirements Warning
1. Lav 2 analyser med forskellige krav
2. Vælg begge
3. Klik "Sammenlign valgte"
4. ✅ Modal vises med advarsel
5. Klik "Ja, fortsæt alligevel"
6. ✅ PDF downloades

### Test Scenarie 3: Edge Cases
- Vælg kun 1 analyse → ✅ Fejl: "Mindst 2 analyser skal vælges"
- Vælg 6 analyser → ✅ Checkbox disabled efter 5
- Cancel warning modal → ✅ Selection bevares, ingen PDF

### Test Scenarie 4: PDF Content
1. Download samlet rapport
2. ✅ Side 1 har oversigt + score distribution
3. ✅ Side 2+ har alle kandidater sorteret efter score
4. ✅ Kandidat info viser korrekt analyse kilde

---

## 📁 Files Changed/Created

### New Files:
- `app/api/analyze/compare/route.ts` - Backend endpoint
- `lib/pdf/compareReport.ts` - PDF template
- `documentation/COMPARE_MODE_FEATURE.md` - This file

### Modified Files:
- `app/(dashboard)/dinprofil/page.tsx` - UI + logic
- `lib/pdf/generator.ts` - Added compare PDF functions
- `lib/pdf/index.ts` - Export new functions

---

## 🔒 Security & Performance

### Authorization
- ✅ Verificerer user token
- ✅ Kun henter brugerens egne analyser
- ✅ RLS policies håndhæves via Supabase

### Performance
- ✅ Henter kun nødvendig data (ikke alle CVer igen)
- ✅ Bruger cached results
- ✅ PDF generation client-side (ikke server load)
- ✅ Max 5 analyser for at undgå hukommelsespres

### Error Recovery
- ✅ Toasts for alle fejl typer
- ✅ Automatic selection clear ved success
- ✅ State reset ved modal cancel

---

## ✅ Definition of Done

- [x] Backend API endpoint `/api/analyze/compare`
- [x] Validering af input (2-5 analyser)
- [x] Check for samme/forskellige krav
- [x] Kombiner alle kandidater
- [x] Sorter efter score
- [x] Beregn score distribution
- [x] PDF template for samlet rapport
- [x] Side 1: Oversigt + stats
- [x] Side 2+: Alle kandidater
- [x] UI checkboxes på analyse liste
- [x] "Sammenlign valgte" knap
- [x] Status bar for selection
- [x] Warning modal for forskellige krav
- [x] PDF download automatisk
- [x] Toast notifications
- [x] Error handling
- [x] Documentation

---

## 📞 Support & Maintenance

Ved fejl eller spørgsmål, tjek:
1. Browser console for frontend errors
2. Server logs for backend errors
3. PDF generation logs
4. Supabase logs for database queries

Common issues:
- **PDF ikke downloaded**: Check browser popup blocker
- **Ingen data**: Check at analyses har cached results
- **Forskellige krav warning loops**: Clear pendingComparisonData state



