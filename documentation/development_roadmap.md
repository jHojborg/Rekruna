# Development Roadmap - Recruitment Screening SaaS

## Phase 1: Project Setup & Foundation

*   [ ] **Task 1: Initialize Project Structure** (reference: `specs/architectural-guidelines.md`, `specs/technical-architecture.md`)
    *   [ ] Create the root project directory `recruitment-screener/`
    *   [ ] Initialize Next.js 15 with TypeScript: `npx create-next-app@latest frontend --typescript --tailwind --app --src-dir=false`
    *   [ ] Create the backend directory structure: `mkdir -p backend/{api,lib,services,utils,types}`
    *   [ ] Create the specs directory and copy all markdown documentation files
    *   [ ] Create shared types directory: `mkdir -p shared/types`
    *   [ ] Set up the monorepo package.json with workspace configuration
    *   [ ] Configure TypeScript paths in `tsconfig.json` for import aliases (`@/components/*`, `@/lib/*`, `@/backend/*`, etc.)

*   [ ] **Task 2: Install Core Dependencies** (reference: `specs/technical-architecture.md`, `specs/ui-ux-specification.md`)
    *   [ ] Frontend dependencies: `cd frontend && npm install @supabase/supabase-js @supabase/auth-helpers-nextjs openai zod lucide-react`
    *   [ ] Install shadcn/ui CLI: `npx shadcn-ui@latest init` with configuration (TypeScript, Tailwind CSS variables, src directory: no)
    *   [ ] Install shadcn/ui components: `npx shadcn-ui@latest add button input card alert dialog form toast skeleton checkbox select`
    *   [ ] Backend/shared dependencies: `npm install -D @types/node dotenv`
    *   [ ] Testing dependencies: `npm install -D jest @testing-library/react @testing-library/jest-dom @playwright/test`

*   [ ] **Task 3: Configure Environment & Services** (reference: `specs/technical-architecture.md`, `specs/security-privacy-spec.md`)
    *   [ ] Create `.env.local` file with required environment variables:
        ```
        NEXT_PUBLIC_SUPABASE_URL=
        NEXT_PUBLIC_SUPABASE_ANON_KEY=
        SUPABASE_SERVICE_ROLE_KEY=
        OPENAI_API_KEY=
        STRIPE_SECRET_KEY=
        STRIPE_WEBHOOK_SECRET=
        STRIPE_PAYMENT_LINK=
        ```
    *   [ ] Set up Supabase project and obtain credentials
    *   [ ] Create OpenAI account and generate API key
    *   [ ] Create Stripe account and set up payment link for monthly subscription (299 DKK)
    *   [ ] Create `lib/config/env.ts` with type-safe environment variable validation as specified in `security-privacy-spec.md`

*   [ ] **Task 4: Set Up Database Schema** (reference: `specs/technical-architecture.md`, `specs/scoring-system.md`)
    *   [ ] Execute the database schema creation in Supabase SQL editor:
        - Create `analyses` table with columns: id, user_id, job_title, job_description_file, requirements (JSONB), status, created_at, completed_at
        - Create `candidates` table with columns: id, analysis_id, name, cv_file, overall_score (0-10 scale), requirement_scores (JSONB)
        - Create `analysis_progress` table for real-time updates
        - Create `error_logs` table for monitoring
        - Create `usage_logs` table for OpenAI API tracking
    *   [ ] Implement all indexes from `performance-scalability-spec.md` for optimal query performance
    *   [ ] Enable Row Level Security (RLS) on all tables with policies from `security-privacy-spec.md`
    *   [ ] Create the `get_user_dashboard` PostgreSQL function for efficient dashboard queries

*   [ ] **Task 5: Implement Core Utilities** (reference: `specs/architectural-guidelines.md`, `specs/security-privacy-spec.md`, `specs/testing-deployment-guide.md`)
    *   [ ] Create `frontend/lib/supabase/client.ts` for Supabase client initialization
    *   [ ] Create `backend/lib/supabase/admin.ts` for server-side Supabase admin client
    *   [ ] Implement `frontend/lib/utils/validators.ts` with password validation (8+ chars, uppercase, lowercase, number, special)
    *   [ ] Implement `frontend/lib/utils/formatters.ts` with Danish date formatting and score formatting
    *   [ ] Create `shared/types/models.ts` with TypeScript interfaces for all database models
    *   [ ] Implement `backend/lib/logger/index.ts` for dual logging approach:
        - Always use console.log/warn/error in development
        - Additionally log to Supabase `error_logs` table in production
        - Include timestamp, level, message, and error stack traces
        - Implement `checkMemoryUsage()` function with 1-minute interval
        - Alert if heap usage exceeds 400MB

## Phase 2: Authentication & Landing Page

*   [ ] **Task 1: Implement Authentication System** (reference: `specs/ui-ux-specification.md`, `specs/security-privacy-spec.md`)
    *   [ ] Create `frontend/app/(auth)/login/page.tsx` with email/password login form
    *   [ ] Create `frontend/app/(auth)/signup/page.tsx` with registration form including consent checkbox
    *   [ ] Implement `frontend/components/auth/LoginForm.tsx` with:
        - Email validation using Zod: `z.string().email('Ugyldig email')`
        - Password input with show/hide toggle
        - Error handling with Danish messages
        - Loading states during authentication
        - "Glemt adgangskode?" link
    *   [ ] Implement `frontend/components/auth/SignupForm.tsx` with:
        - `PasswordInput` component showing requirements in Danish
        - `ConsentCheckbox` component linking to privacy policy
        - Password strength indicator with visual feedback
        - Form validation with Zod schemas
        - Store consent timestamp and IP address in database
    *   [ ] Create `frontend/components/auth/AuthGuard.tsx` for protecting dashboard routes
    *   [ ] Implement `frontend/lib/hooks/useAuth.ts` with:
        - Session management with 7-day expiry
        - Automatic token refresh when < 1 day remaining
        - Check session every minute for refresh needs

*   [ ] **Task 2: Build Landing Page** (reference: `specs/ui-ux-specification.md`, `specs/project-overview.md`)
    *   [ ] Create `frontend/app/page.tsx` as the main landing page
    *   [ ] Implement `frontend/components/landing/HeroSection.tsx` with:
        - Headline: "Screen kandidater 80% hurtigere med AI"
        - Subheadline: "Lad AI analysere CV'er mod dine jobkrav og få en prioriteret kandidatliste på minutter"
        - CTA Button: "Start gratis prøveperiode" linking to signup
    *   [ ] Implement `frontend/components/landing/ProblemSolution.tsx` with the three problems and solutions in Danish
    *   [ ] Create `frontend/components/landing/FeaturesGrid.tsx` displaying 6 feature cards with Lucide icons
    *   [ ] Implement `frontend/components/landing/PricingCard.tsx` showing:
        - Free trial: "14 dage gratis"
        - Pro plan: "299 kr/måned" (highlighted)
    *   [ ] Create `frontend/components/landing/FAQAccordion.tsx` with 5 Danish FAQ items
    *   [ ] Implement `frontend/components/landing/CTASection.tsx` with final call-to-action

*   [ ] **Task 3: Create Privacy Policy Page** (reference: `specs/security-privacy-spec.md`)
    *   [ ] Create `frontend/app/privacy/page.tsx` with Danish privacy policy content
    *   [ ] Include sections: Databehandling, Dine rettigheder, Datasikkerhed, Kontakt
    *   [ ] Style with prose classes for readability

*   [ ] **Task 4: Implement Shared Layout Components** (reference: `specs/ui-ux-specification.md`, `specs/design-system.md`)
    *   [ ] Create `frontend/components/shared/Header.tsx` with navigation and user menu
    *   [ ] Create `frontend/components/shared/Footer.tsx` with copyright and links
    *   [ ] Implement responsive navigation with mobile menu using shadcn/ui Sheet component
    *   [ ] Apply design system colors and typography from `ui-ux-specification.md`

## Phase 3: Core Analysis Workflow

*   [ ] **Task 0: Create Single-Page Analysis Flow** (reference: `specs/ui-ux-specification.md`)
    *   [ ] Create `frontend/app/(dashboard)/analysis/new/page.tsx` as single-page workflow
    *   [ ] Implement `frontend/components/analysis/AnalysisLayout.tsx` with:
        - Progress indicator at top showing current step
        - All sections visible on one page (not wizard-style)
        - Smooth scrolling between sections
        - Sections: JobUpload → Requirements → CVUpload → Processing → Results
    *   [ ] Create `frontend/components/analysis/AnalysisProgress.tsx` showing:
        - Step 1 ──── Step 2 ──── Step 3 ──── ✓
        - Visual connection between steps
        - Current step highlighted

*   [ ] **Task 1: Implement File Upload Components** (reference: `specs/ui-ux-specification.md`, `specs/api-specification.md`)
    *   [ ] Create `frontend/components/analysis/JobUploadSection.tsx` with:
        - Drag & drop zone for PDF files
        - File validation (PDF only, max 10MB)
        - Visual feedback during upload
        - Display uploaded file name
    *   [ ] Implement `frontend/components/shared/FileUpload.tsx` as reusable upload component
    *   [ ] Create `frontend/lib/hooks/useFileUpload.ts` handling:
        - Presigned URL generation via API
        - Direct upload to Supabase Storage
        - Progress tracking
        - Error handling with Danish messages

*   [ ] **Task 2: Build Job Requirements Extraction** (reference: `specs/ai-business-logic.md`, `specs/api-specification.md`)
    *   [ ] Implement `backend/api/analysis/create.ts` API route for creating new analysis session
    *   [ ] Create `backend/api/analysis/upload-job.ts` for presigned URL generation
    *   [ ] Implement `backend/lib/openai/prompts.ts` with:
        - `JOB_ANALYSIS_PROMPT` in Danish (single multi-step prompt)
        - `CV_ANALYSIS_PROMPT` with detailed scoring instructions
        - Language-agnostic instruction: "Svar altid på dansk, uanset hvilket sprog CV'et er skrevet på"
        - Temperature: 0.3 for consistency
        - Response format: JSON object
    *   [ ] Create `backend/lib/openai/analysis.ts` with `analyzeJobDescription` function:
        - Extract text from PDF using OpenAI Files API
        - Analyze with GPT-4o-mini to extract up to 7 requirements
        - Validate response with Zod schema
        - Return structured requirements array
        - Handle any input language (Danish, English, Swedish, etc.)
    *   [ ] Implement `frontend/components/analysis/RequirementSection.tsx` with:
        - Checkbox list of extracted requirements
        - Maximum 3 selections enforced
        - Visual feedback when limit reached
        - Disabled checkboxes after 3 selected
        - "Fortsæt" button when exactly 3 selected

*   [ ] **Task 3: Implement CV Upload & Processing** (reference: `specs/technical-architecture.md`, `specs/performance-scalability-spec.md`)
    *   [ ] Create `frontend/components/analysis/CVUploadSection.tsx` with:
        - Multi-file drag & drop (20-50 files specifically)
        - File validation: PDF only, max 10MB per file
        - File list with individual remove buttons
        - Total file count indicator
        - Batch upload progress
        - Error handling for files exceeding limits
    *   [ ] Implement `backend/api/analysis/upload-cvs.ts` returning multiple presigned URLs
    *   [ ] Create `backend/services/analysis.service.ts` with:
        - `processCVBatch` method (no concurrency per user requirement)
        - `processSingleCV` method using in-memory processing (no streaming)
        - NO CACHING of analysis results (fresh analysis every time)
        - Integration with OpenAI for text extraction and analysis
        - Progress updates via Supabase Realtime
    *   [ ] Implement single-analysis enforcement:
        - Check for existing active analysis before creating new
        - Return error code `ANALYSIS_IN_PROGRESS` if one exists
        - Update UI to disable "Ny Analyse" button
        - Show message: "En analyse kører allerede"

*   [ ] **Task 4: Build Results Display** (reference: `specs/scoring-system.md`, `specs/ui-ux-specification.md`)
    *   [ ] Create `frontend/components/analysis/ResultsSection.tsx` with candidate cards
    *   [ ] Implement `frontend/components/analysis/CandidateCard.tsx` displaying:
        - Candidate name (H2, bold)
        - Overall rating with color coding (0-10 scale)
        - Expandable requirement scores with reasoning
        - Visual hierarchy from `scoring-system.md`
    *   [ ] Apply score color coding:
        - 9-10: Deep green (#10B981)
        - 7-8: Light green (#34D399)
        - 5-6: Yellow (#F59E0B)
        - 3-4: Orange (#FB923C)
        - 0-2: Red (#EF4444)
    *   [ ] Implement sorting by overall score (descending)

*   [ ] **Task 5: Real-time Progress Updates** (reference: `specs/technical-architecture.md`, `specs/api-specification.md`)
    *   [ ] Implement `frontend/components/analysis/ProcessingSection.tsx` with:
        - Progress bar showing "Behandler X af Y CV'er"
        - Current file name being processed
        - No estimated time (keep it simple)
        - Update progress after EACH CV is processed (not batched)
    *   [ ] Create `frontend/lib/hooks/useRealtime.ts` for Supabase channel subscription:
        - Subscribe to channel `analysis:{analysis_id}`
        - Handle events: 'progress', 'candidate_processed', 'complete', 'error'
        - Auto-reconnect on connection loss
        - Cleanup subscription on unmount
    *   [ ] Implement `backend/services/progress.service.ts` for broadcasting updates:
        - Update after each CV processed (not time-based)
        - Send progress events: processed count, total, current file
        - Broadcast individual candidate results as processed
        - Clean up channel on completion
    *   [ ] Create WebSocket event types from `api-specification.md`:
        - Progress updates with current file
        - Individual candidate scores as they complete
        - Completion notification
        - Error events with Danish messages

## Phase 4: Dashboard & User Experience

*   [ ] **Task 1: Build Main Dashboard** (reference: `specs/ui-ux-specification.md`, `specs/project-overview.md`)
    *   [ ] Create `frontend/app/(dashboard)/dashboard/page.tsx` as main dashboard
    *   [ ] Implement `frontend/components/dashboard/QuickActions.tsx` with:
        - Large "Ny Analyse" button (primary, blue)
        - "Se Historik" button (secondary)
        - Disabled state when analysis is running
        - Danish text: "En analyse kører allerede"
    *   [ ] Create `frontend/components/dashboard/ActiveAnalysisBar.tsx` showing:
        - Spinning loader icon
        - "Analyserer: [job title]"
        - Link to view progress
    *   [ ] Implement `frontend/lib/hooks/useAnalysisState.ts` for checking active analysis

*   [ ] **Task 2: Implement Analysis History** (reference: `specs/scoring-system.md`, `specs/api-specification.md`)
    *   [ ] Create `frontend/app/(dashboard)/history/page.tsx` for analysis history
    *   [ ] Implement `frontend/components/dashboard/AnalysisHistory.tsx` showing:
        - Job title/description name
        - Analysis date (Danish format)
        - Number of candidates analyzed
        - Top candidate name & score
        - Expandable to full candidate list
    *   [ ] Create `backend/api/analysis/index.ts` (GET) for fetching user's analyses
    *   [ ] Implement pagination with 10 items per page
    *   [ ] Add filtering by status and date range

*   [ ] **Task 3: PDF Report Generation** (reference: `specs/api-specification.md`, `specs/scoring-system.md`)
    *   [ ] Install PDF generation library: `npm install @react-pdf/renderer`
    *   [ ] Create `backend/lib/pdf/templates.ts` with Danish report template
    *   [ ] Implement `backend/lib/pdf/generator.ts` for creating PDF reports:
        - Company branding header
        - Analysis metadata (date, job title)
        - Candidate results in score order
        - Detailed reasoning for each score
        - Professional typography and spacing
    *   [ ] Create `backend/api/reports/generate.ts` endpoint
    *   [ ] Add "Download Rapport" button to results page

*   [ ] **Task 4: Error Handling & Loading States** (reference: `specs/edge-case-handling.md`, `specs/ui-ux-specification.md`)
    *   [ ] Implement comprehensive error boundaries:
        - `frontend/components/shared/ErrorBoundary.tsx` for React errors
        - Log errors to Supabase error_logs table
        - Show user-friendly Danish error messages
    *   [ ] Create loading states for all async operations:
        - Skeleton loaders for content areas using shadcn/ui Skeleton component
        - Danish progress messages: 
          - "Uploader til AI..."
          - "Analyserer jobkrav..."
          - "Behandler CV'er..."
          - "Modtager resultater..."
        - Special message for large batches: "Du har uploadet en stor fil (eller mange filer). Analysen kan tage et par minutter..."
    *   [ ] Implement `frontend/components/shared/EmptyState.tsx` for:
        - No analyses yet: "Ingen analyser endnu"
        - No results: "Ingen kandidater fundet"
        - With action buttons to guide next steps
    *   [ ] Create toast notifications for:
        - Successful operations: "Analyse færdig!"
        - Errors: "Noget gik galt. Prøv venligst igen."
        - File validation: "Kun PDF-filer er tilladt"
        - Size limits: "Filen er for stor (max 10MB)"

## Phase 5: Subscription & Payment Integration

*   [ ] **Task 1: Stripe Payment Integration** (reference: `specs/technical-architecture.md`, `specs/api-specification.md`)
    *   [ ] Set up Stripe Payment Link (not Checkout Session):
        - Create payment link for 299 DKK/month subscription
        - Configure success URL: `{APP_URL}/dashboard?payment=success`
        - Configure cancel URL: `{APP_URL}/subscription?payment=cancelled`
        - Enable customer portal for subscription management
    *   [ ] Create `backend/api/subscription/create-checkout.ts` that:
        - Simply redirects to the Stripe Payment Link URL
        - Passes user email as prefilled parameter
        - No complex checkout session creation
    *   [ ] Implement `backend/api/auth/stripe-webhook.ts` for handling:
        - `checkout.session.completed` event
        - `customer.subscription.updated` event
        - `customer.subscription.deleted` event
        - Update user subscription status in database
        - Implement webhook signature verification
    *   [ ] Create `backend/lib/stripe/client.ts` for Stripe SDK initialization
    *   [ ] Implement `backend/lib/stripe/webhooks.ts` for:
        - Webhook signature verification
        - Event type handling
        - Database updates for subscription changes

*   [ ] **Task 2: Subscription Management UI** (reference: `specs/ui-ux-specification.md`)
    *   [ ] Create `frontend/app/(dashboard)/subscription/page.tsx` for subscription management
    *   [ ] Implement subscription status display:
        - Current plan (Trial/Active/Expired)
        - Next billing date
        - Payment method (last 4 digits)
        - Cancel subscription button
    *   [ ] Add subscription gate to analysis creation:
        - Check if user has active subscription
        - Redirect to subscription page if not
        - Show clear messaging about subscription requirement

*   [ ] **Task 3: Trial Period Implementation** (reference: `specs/project-overview.md`)
    *   [ ] Implement 14-day free trial on signup:
        - Set trial_ends_at timestamp
        - Allow full access during trial
        - Send reminder emails (future enhancement)
    *   [ ] Create trial expiration handling:
        - Check trial status on analysis creation
        - Show "Trial Expired" message
        - Prompt to subscribe with CTA button

## Phase 6: Testing & Quality Assurance

*   [ ] **Task 1: Component Testing** (reference: `specs/testing-deployment-guide.md`)
    *   [ ] Configure Jest and React Testing Library
    *   [ ] Write tests for critical components:
        - `JobUpload.test.tsx`: PDF validation, file rejection
        - `RequirementSection.test.tsx`: Max 3 selections, UI updates
        - `CandidateCard.test.tsx`: Score display, color coding
        - `LoginForm.test.tsx`: Validation, error states
    *   [ ] Implement test utilities for mocking Supabase and API calls
    *   [ ] Achieve minimum 70% code coverage for components

*   [ ] **Task 2: E2E Testing with Playwright** (reference: `specs/testing-deployment-guide.md`)
    *   [ ] Configure Playwright with `playwright.config.ts`
    *   [ ] Implement critical E2E flows:
        - Complete analysis flow (login → upload → select → process → results)
        - Subscription flow (signup → trial → payment)
        - Error scenarios (invalid files, API failures)
    *   [ ] Create test fixtures:
        - `test-files/job-description.pdf`
        - `test-files/cv1.pdf`, `test-files/cv2.pdf`
        - Mock API responses
    *   [ ] Set up screenshot/video capture for failures

*   [ ] **Task 3: API Testing** (reference: `specs/api-specification.md`)
    *   [ ] Write integration tests for all API endpoints
    *   [ ] Test error responses match specification
    *   [ ] Verify rate limiting works (100 req/min)
    *   [ ] Test authentication and authorization
    *   [ ] Validate request/response schemas with Zod

## Phase 7: Deployment & Launch Preparation

*   [ ] **Task 1: CI/CD Pipeline Setup** (reference: `specs/testing-deployment-guide.md`)
    *   [ ] Create `.github/workflows/ci.yml` with:
        - Type checking: `npm run type-check`
        - Linting: `npm run lint`
        - Component tests: `npm test`
        - E2E tests: `npm run test:e2e`
        - Build verification: `npm run build`
    *   [ ] Configure GitHub secrets for test environment
    *   [ ] Set up branch protection rules for main branch

*   [ ] **Task 2: Vercel Deployment Configuration** (reference: `specs/testing-deployment-guide.md`)
    *   [ ] Create `vercel.json` with:
        - Framework: nextjs
        - Region: arn1 (Stockholm for Danish users)
        - Function timeout: 60s for processing
        - Environment variable mappings
    *   [ ] Install Vercel CLI: `npm i -g vercel`
    *   [ ] Link project: `vercel link`
    *   [ ] Add all environment variables via Vercel CLI
    *   [ ] Configure custom domain (if available)

*   [ ] **Task 3: Production Readiness** (reference: `specs/security-privacy-spec.md`, `specs/performance-scalability-spec.md`, `specs/api-specification.md`)
    *   [ ] Implement security headers in `next.config.js`
    *   [ ] Set up CORS policies for API routes
    *   [ ] Configure rate limiting middleware:
        - Implement 100 requests/minute per user limit
        - Use `backend/middleware/rateLimit.ts`
        - Return proper rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining)
        - Return error code `RATE_LIMIT_EXCEEDED` when exceeded
    *   [ ] Implement request validation on all endpoints using Zod schemas
    *   [ ] Set up automated CV cleanup job (60 days):
        - Create Supabase Edge Function `cleanup-old-cvs`
        - Schedule to run daily at 2 AM
        - Delete CV files older than 60 days from storage
        - Update database records to reflect deletion
        - Log cleanup actions to audit table
    *   [ ] Create admin monitoring dashboard at `/admin`:
        - Display recent errors from `error_logs` table
        - Show system statistics (total analyses, active users, errors last 24h)
        - Memory usage indicators
        - Create `get_system_stats()` PostgreSQL function
        - Protect route with admin role check

*   [ ] **Task 4: Pre-launch Checklist** (reference: `specs/testing-deployment-guide.md`)
    *   [ ] Run full E2E test suite
    *   [ ] Verify all environment variables are set
    *   [ ] Test Stripe webhook in production
    *   [ ] Verify database indexes are created
    *   [ ] Test file upload with 50 CV batch
    *   [ ] Verify Danish translations are correct
    *   [ ] Test on mobile devices
    *   [ ] Create initial blog post/announcement

*   [ ] **Task 5: Launch & Monitoring** (reference: `specs/testing-deployment-guide.md`)
    *   [ ] Deploy to production: `vercel --prod`
    *   [ ] Monitor error logs in Supabase
    *   [ ] Check memory usage and response times
    *   [ ] Set up alerts for high error rates
    *   [ ] Create backup of initial production database
    *   [ ] Document rollback procedure

## Phase 8: Post-Launch Enhancements (Future)

*   [ ] **LinkedIn Integration** - Parse LinkedIn profiles instead of PDFs
*   [ ] **Email Notifications** - Send completion emails with results
*   [ ] **Team Collaboration** - Share analyses with team members
*   [ ] **Advanced Analytics** - Dashboard with usage statistics
*   [ ] **API Access** - REST API for external integrations
*   [ ] **Multiple Languages** - Support beyond Danish
*   [ ] **Chrome Extension** - Quick LinkedIn profile analysis
*   [ ] **Bulk Templates** - Reusable job requirement sets

## Success Metrics to Track

- Time to complete analysis: Target < 5 minutes for 50 CVs
- User activation rate: % who complete first analysis
- Subscription conversion: Trial to paid conversion rate
- System reliability: < 1% error rate
- User satisfaction: NPS score > 50