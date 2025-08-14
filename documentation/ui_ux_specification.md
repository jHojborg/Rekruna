# UI/UX Specification & Component Library

## Landing Page Structure

### 1. Hero Section
```typescript
// components/landing/HeroSection.tsx
interface HeroSectionProps {
  title: string
  subtitle: string
  ctaText: string
  ctaAction: () => void
}
```
**Content:**
- Headline: "Screen kandidater 80% hurtigere med AI"
- Subheadline: "Lad AI analysere CV'er mod dine jobkrav og få en prioriteret kandidatliste på minutter"
- CTA Button: "Start gratis prøveperiode"
- Hero Image: Dashboard mockup or illustration

### 2. Problem/Solution Section
```typescript
// components/landing/ProblemSolution.tsx
interface ProblemSolutionProps {
  problems: Problem[]
  solutions: Solution[]
}
```
**Content:**
- **Problems:**
  - "Timer spildt på manuel CV-screening"
  - "Inkonsistent vurdering af kandidater"
  - "Kvalificerede kandidater overses"
  
- **Solutions:**
  - "AI analyserer alle CV'er på sekunder"
  - "Objektiv scoring baseret på dine krav"
  - "Ingen kandidat bliver overset"

### 3. Features Section
```typescript
// components/landing/FeaturesGrid.tsx
interface Feature {
  icon: LucideIcon
  title: string
  description: string
}
```
**Features:**
1. **Upload & Analyser**
   - Icon: Upload
   - "Upload jobopslag og op til 50 CV'er"
   
2. **AI-drevet Scoring**
   - Icon: Brain
   - "Præcis vurdering med GPT-4 teknologi"
   
3. **Prioriteret Liste**
   - Icon: ListOrdered
   - "Få kandidater rangeret efter match"
   
4. **Detaljeret Rapport**
   - Icon: FileText
   - "Download PDF med begrundelser"
   
5. **Dansk Sprog**
   - Icon: Globe
   - "Fuld support for danske CV'er"
   
6. **GDPR Compliant**
   - Icon: Shield
   - "Sikker håndtering af persondata"

### 4. Pricing Section
```typescript
// components/landing/PricingCard.tsx
interface PricingCardProps {
  title: string
  price: string
  features: string[]
  ctaText: string
  highlighted?: boolean
}
```
**Pricing:**
- **Gratis Prøveperiode**
  - 14 dage gratis
  - Alle funktioner inkluderet
  
- **Pro Plan** (highlighted)
  - 299 kr/måned
  - Ubegrænset antal analyser
  - Prioriteret support
  - Eksport til PDF
  
### 5. FAQ Section
```typescript
// components/landing/FAQAccordion.tsx
interface FAQItem {
  question: string
  answer: string
}
```
**Questions:**
1. "Hvor mange CV'er kan jeg analysere?"
2. "Hvilke filformater understøttes?"
3. "Hvor præcis er AI-vurderingen?"
4. "Hvordan håndteres mine data?"
5. "Kan jeg opsige når som helst?"

### 6. CTA Section
```typescript
// components/landing/CTASection.tsx
```
**Content:**
- Headline: "Klar til at effektivisere din rekruttering?"
- Button: "Start din gratis prøveperiode"
- Subtext: "Ingen kreditkort påkrævet"

## Dashboard Design

### Layout Structure
```typescript
// components/dashboard/DashboardLayout.tsx
<div className="min-h-screen bg-gray-50">
  <DashboardHeader />
  <main className="max-w-7xl mx-auto p-6">
    <QuickActions />
    <RecentAnalyses />
    <UsageStats />
  </main>
</div>
```

### Quick Actions (Primary Focus)
```typescript
// components/dashboard/QuickActions.tsx
```
**Design:**
- Large, prominent buttons with icons
- Grid layout (2 columns on desktop, 1 on mobile)
- Primary actions:
  1. "Ny Analyse" (primary color, larger)
  2. "Se Historik" (secondary)
  3. "Download Rapport" (if recent analysis exists)
  4. "Administrer Abonnement"

### Component Styling
```css
/* Quick Action Button */
.quick-action-btn {
  @apply flex flex-col items-center justify-center p-8 
         bg-white rounded-lg shadow-sm hover:shadow-md 
         transition-shadow cursor-pointer border border-gray-200;
}

.quick-action-btn-primary {
  @apply bg-blue-50 border-blue-200 hover:bg-blue-100;
}
```

## Analysis Workflow (Single Page)

### Page Structure
```typescript
// app/(dashboard)/analysis/new/page.tsx
<AnalysisLayout>
  <AnalysisProgress currentStep={step} />
  
  <div className="space-y-8">
    <JobUploadSection />
    <RequirementSection />
    <CVUploadSection />
    <ProcessingSection />
    <ResultsSection />
  </div>
</AnalysisLayout>
```

### Visual Flow
```
┌─────────────────────────────────────────┐
│  Step 1 ──── Step 2 ──── Step 3 ──── ✓  │ (Progress indicator)
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  📄 Upload Jobopslag                    │
│  [Drop zone or click to upload]         │
│  ✓ jobdescription.pdf                  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  ✏️ Vælg 3 Vigtigste Krav              │
│  □ Dokumenteret ledelseserfaring        │
│  ☑ 5+ års erfaring med React           │
│  ☑ Stærke kommunikationsevner          │
│  ☑ Erfaring med agile metoder          │
│  □ Certificering inden for PM          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  📋 Upload CV'er (maks 50)             │
│  [Drop zone - drag multiple files]      │
│  Uploaded: 23 filer                     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  ⚡ Analyserer...                       │
│  [████████░░░░░░] 12/23 CV'er          │
│  Behandler: Anders_Andersen_CV.pdf     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  📊 Resultater                          │
│  [Prioriteret kandidatliste]           │
└─────────────────────────────────────────┘
```

### Section Components

#### 1. Job Upload Section
```typescript
// components/analysis/JobUploadSection.tsx
interface JobUploadSectionProps {
  onUploadComplete: (file: File, requirements: Requirement[]) => void
  isCompleted: boolean
}
```
- Drag & drop zone
- File validation (PDF only)
- Loading state during AI extraction
- Display extracted requirements

#### 2. Requirement Selection
```typescript
// components/analysis/RequirementSection.tsx
interface RequirementSectionProps {
  requirements: Requirement[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  isCompleted: boolean
}
```
- Checkbox list with max 3 selections
- Disabled when 3 selected
- Clear visual feedback

#### 3. CV Upload Section
```typescript
// components/analysis/CVUploadSection.tsx
interface CVUploadSectionProps {
  onFilesSelected: (files: File[]) => void
  maxFiles: number
  isCompleted: boolean
}
```
- Multi-file drag & drop
- File count indicator
- File list with remove option

#### 4. Processing Section
```typescript
// components/analysis/ProcessingSection.tsx
interface ProcessingSectionProps {
  totalFiles: number
  processedFiles: number
  currentFile?: string
}
```
- Real-time progress bar
- Current file indicator
- Estimated time remaining

#### 5. Results Section
```typescript
// components/analysis/ResultsSection.tsx
interface ResultsSectionProps {
  results: CandidateResult[]
  analysisId: string
}
```
- Candidate cards with scores
- Expandable details
- Download report button

## Design System

### Colors
```css
:root {
  --primary: #2563eb;      /* Blue 600 */
  --primary-hover: #1d4ed8; /* Blue 700 */
  --success: #10b981;      /* Green 500 */
  --warning: #f59e0b;      /* Amber 500 */
  --danger: #ef4444;       /* Red 500 */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-900: #111827;
}
```

### Typography
```css
/* Headings */
.h1 { @apply text-4xl font-bold text-gray-900; }
.h2 { @apply text-3xl font-semibold text-gray-900; }
.h3 { @apply text-2xl font-semibold text-gray-800; }
.h4 { @apply text-xl font-medium text-gray-800; }

/* Body */
.body-large { @apply text-lg text-gray-700; }
.body { @apply text-base text-gray-700; }
.body-small { @apply text-sm text-gray-600; }
```

### Component Patterns
```typescript
// Consistent loading states
<Skeleton className="h-4 w-full" />

// Consistent error states
<Alert variant="destructive">
  <AlertDescription>{error.message}</AlertDescription>
</Alert>

// Consistent empty states
<EmptyState
  icon={FileX}
  title="Ingen analyser endnu"
  description="Start din første analyse for at se resultater her"
  action={{ label: "Ny Analyse", onClick: () => {} }}
/>
```

## Mobile Responsiveness
- All components use Tailwind responsive classes
- Mobile-first approach
- Touch-friendly tap targets (min 44x44px)
- Collapsible navigation on mobile
- Stack layouts on small screens