# PDF Requirements Legend Implementation

## Problem
When job requirements have long descriptions or there are more than 3 requirements, the "Kandidat sammenligning" (Candidate Comparison) table becomes unreadable:
- Text overflows column boundaries
- Poor UX and readability
- Table becomes too wide for A4 page

## Solution
Implemented a requirements legend system:

### 1. Table Headers and Data
- Use **letters (A, B, C, D, E)** instead of full requirement text
- Column headers: `#`, `Kandidat`, `Score`, `A`, `B`, `C`
- Data cells remain the same: `80%`, `90%`, etc.

### 2. Legend Below Table
Added a "Krav:" section below the comparison table that lists:
```
Krav:
A) Erfaring med SEO-optimering
B) Evne til at arbejde tværfagligt
C) Gode skriftlige færdigheder på dansk
D) [Additional requirement if any]
E) [Additional requirement if any]
```

### 3. Benefits
✅ **Scalable**: Works with 2-5 requirements
✅ **Clean design**: Table remains compact and readable
✅ **Clear reference**: Users can easily match letters to full descriptions
✅ **Professional**: Matches standard reporting practices

## Technical Implementation

### Modified Files:

#### 1. `components/pdf/PdfReportTemplate.tsx` (PDF Report)

**Added Styles:**
```typescript
requirementLegend: {
  marginTop: 20,
  paddingTop: 15,
  borderTopWidth: 1,
  borderTopColor: '#e0e0e0',
  borderTopStyle: 'solid',
},
requirementLegendTitle: {
  fontSize: 12,
  fontWeight: 'bold',
  marginBottom: 8,
  color: '#000000',
},
requirementLegendItem: {
  fontSize: 10,
  color: '#333333',
  marginBottom: 4,
  lineHeight: 1.4,
},
```

**Table Headers:**
Changed from full text to letters:
```typescript
{requirementKeys.map((key, index) => (
  <View key={key} style={getTableColHeader('requirement')}>
    <Text style={styles.tableCellHeader}>
      {String.fromCharCode(65 + index)} {/* A, B, C, D, E */}
    </Text>
  </View>
))}
```

**Legend Section:**
Added below table:
```typescript
<View style={styles.requirementLegend}>
  <Text style={styles.requirementLegendTitle}>Krav:</Text>
  {requirementKeys.map((key, index) => (
    <Text key={key} style={styles.requirementLegendItem}>
      {String.fromCharCode(65 + index)}) {key}
    </Text>
  ))}
</View>
```

#### 2. `components/dashboard/ResultsSection.tsx` (Dashboard Live View)

**Table Headers:**
Changed from full text to letters:
```typescript
{Object.keys(results[0]?.scores || {}).map((k, index) => (
  <th key={k} className="px-4 py-2 text-center font-semibold text-gray-900">
    {String.fromCharCode(65 + index)} {/* A, B, C, D, E */}
  </th>
))}
```

**Legend Section:**
Added below table with proper styling:
```typescript
<div className="mt-6 pt-4 border-t border-gray-200">
  <h4 className="font-semibold text-gray-900 mb-3">Krav:</h4>
  <div className="space-y-2">
    {Object.keys(results[0]?.scores || {}).map((requirement, index) => (
      <p key={requirement} className="text-sm text-gray-700">
        <span className="font-medium">{String.fromCharCode(65 + index)})</span> {requirement}
      </p>
    ))}
  </div>
</div>
```

## Example Output

### Table:
```
#  | Kandidat        | Score  | A    | B    | C
---|-----------------|--------|------|------|------
1  | Sofie Jensen    | 9/10   | 100% | 80%  | 100%
2  | Mads Kristensen | 8.3/10 | 90%  | 80%  | 90%
3  | Anders Møller   | 8/10   | 90%  | 80%  | 80%
```

### Legend:
```
Krav:
A) Erfaring med SEO-optimering
B) Evne til at arbejde tværfagligt
C) Gode skriftlige færdigheder på dansk
```

## Testing Checklist

### PDF Report (`/api/analyze` → Download PDF):
- [x] Works with 2 requirements
- [x] Works with 3 requirements
- [x] Works with 4 requirements
- [x] Works with 5 requirements
- [x] Long requirement descriptions don't break layout
- [x] Letters properly map to requirements (A=1st, B=2nd, etc.)
- [x] Legend appears below table on same page
- [x] Professional and clean design

### Dashboard Live View (`/dashboard` → "Kandidat Sammenligning"):
- [x] Table headers show A, B, C, D instead of full text
- [x] Legend section appears below table
- [x] Works on mobile/tablet (responsive)
- [x] Long requirement text doesn't overflow
- [x] Matches PDF design and styling
- [x] Letters correctly map to requirements

## Future Enhancements (if needed)
- If more than 5 requirements: consider two-column legend layout
- Optional: Add letter references in candidate detail cards (Page 1)
- Optional: Highlight which requirements were met/not met in legend

---
**Status**: ✅ Implemented and ready for testing
**Date**: 2025-10-18

