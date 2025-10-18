# Custom Requirements Feature

## Overview
Users can now write their own job requirements if AI extraction fails, or supplement AI-extracted requirements with custom ones. This provides flexibility and control over the analysis criteria.

---

## Key Changes

### 1. **Flexible Requirement Count: 2-5 (not fixed at 3)**
- **Before:** Must select exactly 3 requirements
- **After:** Can select 2-5 requirements
- **Rationale:** Different jobs have different complexity levels

### 2. **Custom Requirements**
- Users can add their own requirements at any time
- Custom requirements can be removed
- Custom requirements are auto-selected when added
- Mix of AI + custom requirements allowed

### 3. **No Fallback to Generic Requirements**
- **Before:** If AI failed → show generic fallback requirements
- **After:** If AI fails → empty list → user writes their own
- **Rationale:** Generic requirements are not relevant to specific job

---

## User Experience

### Scenario 1: AI Successfully Extracts Requirements
```
1. User uploads job PDF
2. Shows "Vi analyserer dit stillingsopslag..." (loading)
3. AI extracts 6 requirements
4. UI shows:
   ┌─────────────────────────────────────────────────┐
   │ Vælg "Must-Have" krav                           │
   │ Rekruna har fundet 6 krav.                     │
   │ Vælg 2-5 vigtigste krav, eller tilføj dine egne│
   ├─────────────────────────────────────────────────┤
   │ ☐ 5+ års erfaring med React                    │
   │ ☐ TypeScript og Node.js kendskab               │
   │ ☐ GraphQL og REST API erfaring                 │
   │ ☐ DevOps og CI/CD pipeline                     │
   │ ☐ Agile metoder og Scrum                       │
   │ ☐ Ledelseserfaring med team på 5+             │
   ├─────────────────────────────────────────────────┤
   │ [+ Tilføj dit eget krav]                       │
   ├─────────────────────────────────────────────────┤
   │ [← Tilbage]  Valgt: 0/2-5 krav    [Fortsæt]   │
   └─────────────────────────────────────────────────┘
```

### Scenario 2: AI Fails to Extract Requirements
```
1. User uploads job PDF
2. Shows "Vi analyserer dit stillingsopslag..." (loading)
3. AI extraction fails
4. Toast: "Vi kunne ikke udtrække krav automatisk. 
           Du kan nu skrive dine egne krav."
5. UI shows:
   ┌─────────────────────────────────────────────────┐
   │ Skriv dine "Must-Have" krav                    │
   │ Rekruna kunne ikke finde krav automatisk.     │
   │ Skriv 2-5 vigtigste krav som kandidaten       │
   │ skal opfylde.                                  │
   ├─────────────────────────────────────────────────┤
   │ [Blue input box appears by default]            │
   │ Tilføj dit eget krav:                         │
   │ ┌─────────────────────────────────────────┐   │
   │ │ Fx: 5+ års erfaring med React          │   │
   │ └─────────────────────────────────────────┘   │
   │                         [Tilføj] [Annuller]   │
   ├─────────────────────────────────────────────────┤
   │ [← Tilbage]  Valgt: 0/2-5 krav    [Fortsæt]   │
   └─────────────────────────────────────────────────┘
```

### Scenario 3: User Adds Custom Requirements
```
1. AI extracts 3 requirements
2. User wants to add more specific requirement
3. Clicks "[+ Tilføj dit eget krav]"
4. Blue input box appears:
   ┌─────────────────────────────────────────────────┐
   │ Tilføj dit eget krav:                          │
   │ ┌─────────────────────────────────────────────┐ │
   │ │ Fx: 5+ års erfaring med React              │ │
   │ └─────────────────────────────────────────────┘ │
   │                         [Tilføj] [Annuller]    │
   └─────────────────────────────────────────────────┘
5. Types: "Certificering i AWS Solutions Architect"
6. Clicks [Tilføj]
7. New requirement appears with checkmark + "(Dit eget krav)" label
   ☑ Certificering i AWS Solutions Architect (Dit eget krav) [X]
8. Auto-selected and counts toward 2-5 limit
```

---

## UI Components

### Add Custom Requirement Button
- Dashed border, hover effect
- Icon: Plus (+)
- Text: "Tilføj dit eget krav"
- Expands to input box when clicked

### Custom Requirement Input Box
- Blue background (`bg-blue-50`, `border-blue-200`)
- Label: "Tilføj dit eget krav:"
- Placeholder: "Fx: 5+ års erfaring med React"
- Buttons: [Tilføj] [Annuller]
- Enter key submits
- Auto-focus on open

### Custom Requirement Item
- Checkbox (auto-selected)
- Text content
- "(Dit eget krav)" label (gray, small text)
- Remove button (X icon, red on hover)

---

## Validation Rules

### Requirement Text
- **Minimum:** 5 characters
- **Maximum:** None (but reasonable - fits UI)
- **Error:** "Krav skal være mindst 5 tegn langt."

### Selection Count
- **Minimum:** 2 requirements selected
- **Maximum:** 5 requirements selected
- **Button State:** "Fortsæt" disabled if < 2 or > 5

### Duplicate Prevention
- No technical duplicate prevention currently
- User can add similar requirements if desired

---

## Technical Implementation

### Component: `RequirementSelector.tsx`

#### Props:
```typescript
interface RequirementSelectorProps {
  requirements: Array<{
    id: string
    text: string
    selected: boolean
    isCustom?: boolean
  }>
  onToggle: (id: string) => void
  onContinue: () => void
  onBack: () => void
  onAddCustom: (text: string) => void
  onRemoveCustom: (id: string) => void
}
```

#### Key Features:
- **Dynamic header:** Changes based on AI vs. custom mode
- **Dynamic description:** Shows AI count or prompts user to write
- **Auto-show input:** If no AI requirements, input shown by default
- **Flexible limit:** Enforces 2-5 selection dynamically

---

### Dashboard: `dashboard/page.tsx`

#### Custom Requirement Handlers:
```typescript
// Add custom requirement
const addCustomRequirement = (text: string) => {
  const newReq = {
    id: `custom-${Date.now()}`,
    text: text,
    selected: true, // Auto-select
    isCustom: true
  }
  setRequirements(prev => [...prev, newReq])
}

// Remove custom requirement
const removeCustomRequirement = (id: string) => {
  setRequirements(prev => prev.filter(r => r.id !== id))
}
```

#### Error Handling:
```typescript
catch (e: any) {
  errorToast.info('Vi kunne ikke udtrække krav automatisk. Du kan nu skrive dine egne krav.')
  setRequirements([]) // Clear - no fallback!
}
```

---

## Configuration

### Change Min/Max Requirements:
**File:** `components/dashboard/RequirementSelector.tsx`

```typescript
const MIN_REQUIREMENTS = 2  // Change here
const MAX_REQUIREMENTS = 5  // Change here
```

### Disable Auto-Select for Custom:
```typescript
const newReq = {
  // ...
  selected: false, // Don't auto-select
  isCustom: true
}
```

---

## Future Enhancements

### 1. **Requirement Templates**
- Predefined common requirements by job category
- "Developer", "Manager", "Sales" templates
- Quick-add buttons

### 2. **AI Suggestion While Typing**
- As user types custom requirement, suggest similar ones
- Autocomplete based on common requirements
- Prevents duplicates

### 3. **Requirement Library**
- Save custom requirements for reuse
- Personal requirement library per user
- One-click add from library

### 4. **Requirement Importance Levels**
- Not just selected/unselected
- Priority: Critical, Important, Nice-to-have
- Different scoring weights

### 5. **Bulk Import**
- Paste list of requirements from job ad
- Parse line-by-line
- Quick setup for complex jobs

### 6. **Requirement Validation**
- Warn if requirement is too vague
- Suggest more specific wording
- Check for measurability

---

## Testing Checklist

### Normal Flow (AI Success):
- [ ] Upload job PDF
- [ ] AI extracts 5+ requirements
- [ ] Select 3 requirements
- [ ] Click "Fortsæt" - should work
- [ ] Go back, select 2 - should work
- [ ] Go back, select 6 - "Fortsæt" disabled
- [ ] Click "+ Tilføj dit eget krav"
- [ ] Add custom requirement
- [ ] Custom requirement appears with "(Dit eget krav)"
- [ ] Custom requirement is auto-selected
- [ ] Remove custom requirement with X button
- [ ] Continue to CV upload

### Error Flow (AI Fails):
- [ ] Upload corrupted/empty job PDF
- [ ] See toast: "Vi kunne ikke udtrække krav..."
- [ ] UI shows: "Skriv dine 'Must-Have' krav"
- [ ] Input box shown by default
- [ ] Add 2 custom requirements
- [ ] Try to continue - should work
- [ ] Add 3 more (total 5) - should work
- [ ] Try to select 6th - should be disabled
- [ ] Remove one requirement
- [ ] Continue to CV upload

### Edge Cases:
- [ ] Try to add requirement with only 3 characters - error
- [ ] Add requirement, remove it, add again - should work
- [ ] Select 5 requirements, add custom (auto-selected) - should prevent
- [ ] Mix of AI + custom requirements - should work seamlessly
- [ ] Press Enter in input box - should add requirement
- [ ] Press Annuller - input box closes, text cleared

---

## Related Files
- `components/dashboard/RequirementSelector.tsx` - Main UI component
- `app/(dashboard)/dashboard/page.tsx` - State management & handlers
- `app/api/requirements/extract/route.ts` - AI extraction endpoint

## Related Documentation
- `ERROR_HANDLING_TOAST.md` - Toast notifications
- `FILE_PREVIEW_UI.md` - Upload UI patterns



