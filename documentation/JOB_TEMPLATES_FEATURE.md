# Job Templates Feature

## Overview
Save job requirements as reusable templates for repeated recruitment to the same position. Eliminates repetitive job upload and requirement selection.

---

## User Flow

### Creating a Template:

```
1. Upload job PDF (step 1)
2. AI extracts requirements (step 2)
3. Select 2-5 requirements
4. Click "Gem som template (genbrug kravene senere)"
5. Enter template name: "Senior React Developer"
6. (Optional) Add description
7. Click "Gem template"
8. ✅ Template saved!
```

### Using a Template:

```
1. On step 1, dropdown appears: "Eller brug en tidligere template"
2. Select "Senior React Developer" from dropdown
3. ✅ Requirements auto-loaded and selected
4. Skip to step 3 (CV upload)
5. Analyze!
```

---

## Features

### ✅ Smart Template Selector
- Appears on step 1 if user has templates
- Shows template title + usage count
- "brugt 3 gange" indicator
- Auto-hides when file selected

### ✅ Save Template Button
- Appears on step 2 (requirement selector)
- Only shows when 2-5 requirements selected
- Disabled if using existing template
- Clear call-to-action text

### ✅ Template Modal
- Clean, focused interface
- Required: Template name (min 3 chars)
- Optional: Description
- Shows job file name
- Validation before save

### ✅ Auto-Load Requirements
- Template requirements auto-selected
- Skips AI extraction
- Goes straight to step 2
- Can modify before continuing

### ✅ Usage Tracking
- Tracks `usage_count`
- Updates `last_used_at`
- Shows in template dropdown
- Non-critical (won't break if fails)

---

## Database Schema

```sql
CREATE TABLE job_templates (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  
  -- Template info
  title TEXT NOT NULL,
  description TEXT,
  job_file_name TEXT,
  
  -- Requirements (JSON array)
  requirements JSONB NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  last_used_at TIMESTAMP,
  usage_count INTEGER DEFAULT 0
);
```

---

## API Endpoints

### GET /api/templates
**Auth:** Required  
**Returns:** List of user's templates

```typescript
{
  ok: true,
  templates: [
    {
      id: "uuid",
      title: "Senior React Developer",
      description: "Tech lead position",
      requirements: [...],
      usage_count: 3,
      last_used_at: "2024-10-17T..."
    }
  ]
}
```

### POST /api/templates
**Auth:** Required  
**Body:**
```typescript
{
  title: string,          // Required, min 3 chars
  description?: string,   // Optional
  jobFileName?: string,   // Optional
  requirements: Array     // Required, 2-5 items
}
```

**Returns:**
```typescript
{
  ok: true,
  template: { ... }
}
```

### POST /api/templates/[id]/use
**Auth:** Required  
**Purpose:** Track usage  
**Returns:** `{ ok: true }`

### DELETE /api/templates?id=[uuid]
**Auth:** Required  
**Purpose:** Delete template  
**Returns:** `{ ok: true }`

---

## UI Components

### JobUploadCard
**New Props:**
- `onTemplateSelected: (template) => void`

**New Features:**
- Template dropdown (if templates exist)
- Blue highlight box
- Usage count display

### RequirementSelector
**New Props:**
- `onSaveTemplate?: () => void`
- `showSaveTemplate?: boolean`

**New Features:**
- "Gem som template" button
- Only shows if `showSaveTemplate=true`
- Only visible when 2-5 selected

### SaveTemplateModal (New Component)
**Props:**
- `isOpen: boolean`
- `onClose: () => void`
- `onSave: (title, description) => Promise<void>`
- `jobFileName?: string`

**Features:**
- Title input (required, min 3 chars)
- Description textarea (optional)
- Job file name display
- Loading state
- Validation

---

## State Management (Dashboard)

### New State:
```typescript
const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false)
const [usingTemplate, setUsingTemplate] = useState(false)
```

### New Functions:
```typescript
handleTemplateSelected(template)  // Load template requirements
openSaveTemplateModal()           // Show modal
saveTemplate(title, description)  // Save via API
```

---

## Configuration

### Min/Max Requirements
**File:** `components/dashboard/RequirementSelector.tsx`
```typescript
const MIN_REQUIREMENTS = 2
const MAX_REQUIREMENTS = 5
```

### Template Title Validation
**File:** `components/dashboard/SaveTemplateModal.tsx`
```typescript
if (title.trim().length < 3) {
  alert('Titel skal være mindst 3 tegn.')
}
```

---

## Testing Checklist

### Create Template:
- [ ] Upload job PDF
- [ ] Select 3 requirements
- [ ] Click "Gem som template"
- [ ] Modal opens
- [ ] Enter name < 3 chars → Error
- [ ] Enter name ≥ 3 chars → Works
- [ ] Add description (optional)
- [ ] Save → Success toast
- [ ] Modal closes

### Use Template:
- [ ] Start new analysis
- [ ] See dropdown: "Eller brug en tidligere template"
- [ ] Select template
- [ ] Requirements auto-loaded
- [ ] All requirements selected
- [ ] On step 2 directly
- [ ] "Gem som template" button hidden
- [ ] Can modify requirements
- [ ] Continue to CV upload

### Template Management:
- [ ] Create 3 templates
- [ ] All appear in dropdown
- [ ] Usage count shows correctly
- [ ] Use template → count increments
- [ ] Dropdown sorted by creation date (newest first)

### Edge Cases:
- [ ] Try to save with 1 requirement → Error
- [ ] Try to save with 6 requirements → Error
- [ ] Try to save while logged out → Auth error
- [ ] Network error → User-friendly message
- [ ] Close modal without saving → No template created
- [ ] Use template, modify requirements → Can save as new template

---

## Future Enhancements

### 1. Template Management Page
- View all templates
- Edit template title/description
- Delete templates
- See usage stats
- Sort by usage/date

### 2. Template Sharing
- Share template with team
- Organization-wide templates
- Template marketplace

### 3. Template Import/Export
- Export as JSON
- Import from file
- Backup/restore

### 4. Smart Template Suggestions
- AI suggests template name
- Auto-categorize templates
- Detect similar templates

---

## Known Limitations

1. **No template editing**
   - Must delete and recreate
   - Coming in v1.1

2. **No template deletion from dashboard**
   - Must use API directly
   - UI coming soon

3. **No template search**
   - All templates shown in dropdown
   - Search needed if 20+ templates

---

## Related Files
- `database_migrations/add_job_templates_table.sql`
- `app/api/templates/route.ts`
- `app/api/templates/[id]/use/route.ts`
- `components/dashboard/SaveTemplateModal.tsx`
- `components/dashboard/JobUploadCard.tsx`
- `components/dashboard/RequirementSelector.tsx`
- `app/(dashboard)/dashboard/page.tsx`

## Next Steps
- Test Feature 1
- Then implement Feature 5 (Compare Mode)



