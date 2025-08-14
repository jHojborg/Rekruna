# Architectural Guidelines & Project Structure

## Core Principles
1. **Super Lean & Modular**: Every piece of functionality in its own module
2. **Component-Based**: Reusable components for all UI elements
3. **Utility-First**: Shared utilities for common operations
4. **Clear Separation**: Frontend and backend completely separated
5. **No Long Files**: Maximum 100-150 lines per file (excluding imports)

## Project Structure
```
recruitment-screener/
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── analysis/
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   └── [route handlers moved to backend]
│   │   ├── layout.tsx
│   │   └── page.tsx (landing)
│   ├── components/
│   │   ├── ui/
│   │   │   └── [shadcn components]
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   └── AuthGuard.tsx
│   │   ├── analysis/
│   │   │   ├── JobUpload.tsx
│   │   │   ├── RequirementSelector.tsx
│   │   │   ├── CVUpload.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── ResultsDisplay.tsx
│   │   ├── dashboard/
│   │   │   ├── AnalysisHistory.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   └── QuickActions.tsx
│   │   └── shared/
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── ErrorBoundary.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── auth.ts
│   │   ├── utils/
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   └── constants.ts
│   │   └── hooks/
│   │       ├── useAuth.ts
│   │       ├── useAnalysis.ts
│   │       └── useRealtime.ts
│   └── types/
│       ├── analysis.ts
│       ├── user.ts
│       └── api.ts
│
├── backend/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.ts
│   │   │   ├── logout.ts
│   │   │   └── stripe-webhook.ts
│   │   ├── analysis/
│   │   │   ├── create.ts
│   │   │   ├── upload-job.ts
│   │   │   ├── upload-cvs.ts
│   │   │   ├── process.ts
│   │   │   └── status.ts
│   │   ├── reports/
│   │   │   └── generate.ts
│   │   └── subscription/
│   │       ├── create-checkout.ts
│   │       └── manage.ts
│   ├── lib/
│   │   ├── openai/
│   │   │   ├── client.ts
│   │   │   ├── prompts.ts
│   │   │   └── analysis.ts
│   │   ├── supabase/
│   │   │   ├── admin.ts
│   │   │   └── storage.ts
│   │   ├── stripe/
│   │   │   ├── client.ts
│   │   │   └── webhooks.ts
│   │   └── pdf/
│   │       ├── generator.ts
│   │       └── templates.ts
│   ├── services/
│   │   ├── analysis.service.ts
│   │   ├── user.service.ts
│   │   └── cleanup.service.ts
│   ├── utils/
│   │   ├── errors.ts
│   │   ├── logger.ts
│   │   └── validators.ts
│   └── types/
│       └── [shared with frontend]
│
├── specs/
│   ├── project-overview.md
│   ├── technical-architecture.md
│   ├── scoring-system.md
│   ├── architectural-guidelines.md
│   ├── api-specification.md
│   ├── component-library.md
│   └── deployment-guide.md
│
├── shared/
│   └── types/
│       ├── models.ts
│       ├── enums.ts
│       └── interfaces.ts
│
└── [config files at root]
    ├── package.json
    ├── tsconfig.json
    ├── .env.example
    └── README.md
```

## Component Guidelines

### File Size Limits
- Components: Max 100 lines
- Utilities: Max 50 lines per function
- Services: Max 150 lines
- Split larger files into smaller, focused modules

### Component Structure Example
```typescript
// components/analysis/JobUpload.tsx
import { useJobUpload } from '@/lib/hooks/useJobUpload'
import { FileUpload } from '@/components/shared/FileUpload'
import { validatePDF } from '@/lib/utils/validators'

export function JobUpload({ onComplete }: JobUploadProps) {
  const { upload, isLoading } = useJobUpload()
  
  return (
    <FileUpload
      accept=".pdf"
      onUpload={upload}
      validator={validatePDF}
      isLoading={isLoading}
    />
  )
}
```

### Utility Structure Example
```typescript
// lib/utils/formatters.ts
export const formatScore = (score: number): string => {
  return score.toFixed(1)
}

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('da-DK').format(date)
}

// Each utility function focused on one task
```

## Backend API Structure

### Route Handler Example
```typescript
// backend/api/analysis/create.ts
import { createAnalysis } from '@/services/analysis.service'
import { validateRequest } from '@/utils/validators'
import { handleError } from '@/utils/errors'

export async function POST(request: Request) {
  try {
    const data = await validateRequest(request)
    const result = await createAnalysis(data)
    return Response.json(result)
  } catch (error) {
    return handleError(error)
  }
}
```

### Service Layer Example
```typescript
// backend/services/analysis.service.ts
import { supabaseAdmin } from '@/lib/supabase/admin'
import { analyzeWithOpenAI } from '@/lib/openai/analysis'

export async function createAnalysis(data: CreateAnalysisDto) {
  // Single responsibility: orchestrate the analysis creation
  const analysis = await supabaseAdmin
    .from('analyses')
    .insert(data)
    .select()
    .single()
    
  return analysis
}
```

## Import Aliases
```json
{
  "compilerOptions": {
    "paths": {
      "@/components/*": ["./frontend/components/*"],
      "@/lib/*": ["./frontend/lib/*"],
      "@/hooks/*": ["./frontend/lib/hooks/*"],
      "@/utils/*": ["./frontend/lib/utils/*"],
      "@/types/*": ["./shared/types/*"],
      "@/backend/*": ["./backend/*"],
      "@/services/*": ["./backend/services/*"]
    }
  }
}
```

## Key Architecture Rules

1. **No Direct API Calls from Components**
   - Use custom hooks that wrap API calls
   - Components only handle UI logic

2. **Shared Types**
   - All types in `shared/types` folder
   - Import from both frontend and backend

3. **Error Boundaries**
   - Wrap each major section in error boundaries
   - Graceful error handling at component level

4. **State Management**
   - Use React hooks for local state
   - Zustand for global state if needed
   - No prop drilling beyond 2 levels

5. **API Design**
   - RESTful endpoints
   - Consistent error responses
   - Request/response validation

6. **Testing Structure**
   - Unit tests next to components
   - Integration tests in `__tests__` folders
   - E2E tests in separate `e2e` folder