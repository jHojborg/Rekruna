# 🚀 Deployment Prompt for Rekruna CV Screener

**Status**: Klar til production deployment efter omfattende local testing
**Dato**: 2025-10-18
**Framework**: Next.js 14 (App Router)
**Database**: Supabase (PostgreSQL)
**Payments**: Stripe
**AI**: OpenAI GPT-4

---

## 📋 Projekt Oversigt

Rekruna CV Screener er en SaaS platform der automatisk analyserer CV'er mod job requirements ved hjælp af AI.

### Core Funktionalitet:
1. ✅ **Job Description Upload** (PDF) → AI udtrækker 2-5 vigtigste krav
2. ✅ **CV Upload** (PDF, op til 50 stk.) → Batch processing
3. ✅ **AI Analyse** (GPT-4) → Kandidat scoring og ranking
4. ✅ **PDF Rapport Generation** → Professionel rapport med kandidat sammenligning
5. ✅ **Compare Mode** → Sammenlign flere analyser af samme job
6. ✅ **Job Templates** → Gem og genbruge job beskrivelser + krav
7. ✅ **Credit System** → Pay-as-you-go pricing model
8. ✅ **Stripe Integration** → Subscription + one-time payments
9. ✅ **User Profiles** → Company info og analysis history (30 dage)
10. ✅ **Custom Requirements** → Brugere kan tilføje egne krav hvis AI extraction fejler

---

## 🏗️ Teknisk Stack

### Frontend:
- **Framework**: Next.js 14.2+ (App Router, React 18+)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + custom components
- **PDF Generation**: @react-pdf/renderer (client-side)
- **PDF Parsing**: pdfjs-dist
- **Notifications**: react-hot-toast
- **Icons**: lucide-react

### Backend:
- **Runtime**: Node.js (Next.js API Routes)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Storage**: Supabase Storage (PDF files, max 60 days retention)
- **Auth**: Supabase Auth (email/password)
- **Payments**: Stripe (webhooks for subscription management)
- **AI**: OpenAI GPT-4 API
- **Caching**: Database-level caching (analysis_cache, cv_text_cache, resume_cache)

### Deployment Target:
- **Platform**: Vercel (recommended) eller anden Next.js-kompatibel platform
- **Region**: EU (GDPR compliance)

---

## 🗄️ Database Schema

### Supabase Tables (alle migrationer ligger i `database_migrations/`):

1. **`user_profiles`** - Company info og user metadata
2. **`credit_balances`** - Credit tracking per user
3. **`credit_transactions`** - Transaction history og audit log
4. **`analysis_results`** - Alle analyse resultater (60 dage retention)
5. **`analysis_cache`** - Cache for analysis metadata
6. **`cv_text_cache`** - Parsed CV text (60 dage, reducerer AI costs)
7. **`resume_cache`** - Generated CV resumés
8. **`job_templates`** - Saved job descriptions + requirements

### Storage Buckets:
- **`analysis-reports`** - PDF rapporter (60 dage retention, private)

### Row Level Security (RLS):
- ✅ Alle tables har RLS enabled
- ✅ Users kan kun se egne data
- ✅ Admin access via service role key

---

## 🔐 Environment Variables

### Required (MUST be set):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Stripe
STRIPE_SECRET_KEY=sk_live_... (eller sk_test_... for staging)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (eller pk_test_...)
STRIPE_WEBHOOK_SECRET=whsec_...

# App Config
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### Stripe Products (skal oprettes i Stripe Dashboard):

**Pay As You Go:**
- Product ID: `prod_xxx`
- Price: 99 DKK per analyse

**Pro Plan:**
- Product ID: `prod_xxx`
- Price: 699 DKK/måned
- Credits: 10 per måned

**Business Plan:**
- Product ID: `prod_xxx`
- Price: 1499 DKK/måned
- Credits: 25 per måned

**NOTE**: Opdater product IDs i `app/api/checkout/route.ts` og `app/api/webhooks/route.ts`

---

## 📝 Pre-Deployment Checklist

### 1. Database Setup:
```bash
# Run alle migrations i Supabase SQL Editor (i rækkefølge):
1. database_migrations/add_user_profiles_table.sql
2. database_migrations/add_credit_system_complete.sql
3. database_migrations/ensure_analysis_results_table.sql
4. database_migrations/add_cache_tables.sql
5. database_migrations/add_job_templates_table.sql

# Verify RLS policies er enabled på alle tables
```

### 2. Storage Setup:
```bash
# Opret bucket i Supabase Dashboard:
- Bucket name: "analysis-reports"
- Public: NO (private)
- File size limit: 50 MB
- Allowed MIME types: application/pdf
```

### 3. Stripe Setup:
```bash
# 1. Opret Products i Stripe Dashboard
# 2. Opret webhook endpoint: https://your-domain.com/api/webhooks
# 3. Select events: 
#    - checkout.session.completed
#    - customer.subscription.created
#    - customer.subscription.updated
#    - customer.subscription.deleted
#    - invoice.payment_succeeded
#    - invoice.payment_failed
# 4. Copy webhook secret til STRIPE_WEBHOOK_SECRET
```

### 4. Code Updates:
```typescript
// Update Stripe product IDs i følgende filer:
- app/api/checkout/route.ts (lines ~30-60)
- app/api/webhooks/route.ts (lines ~150-180)
- components/landing/PricingCard.tsx (optional, kun for display)

// Update app URL i:
- app/api/checkout/route.ts (success/cancel URLs)
- env.example → .env.production
```

### 5. Security Check:
- [ ] Alle `.env*` filer er i `.gitignore`
- [ ] Ingen hardcoded API keys i kode
- [ ] RLS policies verificeret på alle tables
- [ ] Service role key kun brugt server-side
- [ ] CORS policies korrekt konfigureret i Supabase

### 6. Performance Check:
- [ ] Caching er aktiveret (analysis_cache, cv_text_cache, resume_cache)
- [ ] PDF validation er disabled (eller meget lenient)
- [ ] API rate limiting overvejet (OpenAI har default limits)
- [ ] Database indexes på `user_id`, `analysis_id`, `created_at`

---

## 🚀 Deployment Steps (Vercel)

### 1. Initial Setup:
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link
```

### 2. Configure Environment Variables:
```bash
# Set all env vars via Vercel Dashboard eller CLI:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OPENAI_API_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add NEXT_PUBLIC_APP_URL
```

### 3. Deploy:
```bash
# Preview deployment (test first!)
vercel

# Production deployment
vercel --prod
```

### 4. Post-Deployment:
1. ✅ Test authentication flow
2. ✅ Test credit purchase (use Stripe test cards)
3. ✅ Test analysis with 1-2 CVs (verify PDF generation)
4. ✅ Test Compare Mode
5. ✅ Test Job Templates
6. ✅ Verify webhook delivery i Stripe Dashboard
7. ✅ Check Supabase logs for errors
8. ✅ Monitor OpenAI usage/costs

---

## ⚠️ Known Issues & Considerations

### 1. PDF Validation:
- **Status**: Disabled (too aggressive)
- **Location**: `lib/constants.ts` → `PDF_VALIDATION.ENABLED = false`
- **Future**: Consider backend validation eller more lenient checks

### 2. Upload Limits:
- **Max CVs**: 50 (configurable i `lib/constants.ts`)
- **Total size**: 100 MB
- **Individual file**: 10 MB
- **Scaling**: Easily adjustable via `UPLOAD_LIMITS` config

### 3. Cache Expiry:
- **CV text cache**: 60 dage (extended from 2 hours)
- **Analysis results**: 60 dage retention
- **Resume cache**: 60 dage
- **Reports (Storage)**: 60 dage

### 4. Rate Limiting:
- **OpenAI**: Default API rate limits apply
- **Stripe**: No limits on webhook calls
- **Supabase**: Free tier has limits (upgrade to Pro if needed)

### 5. Error Handling:
- ✅ Toast notifications for all user-facing errors
- ✅ Detailed logging for debugging
- ✅ Graceful degradation (e.g., resume generation failures)
- ✅ Retry functionality for failed operations

---

## 📊 Monitoring & Maintenance

### Key Metrics to Track:
1. **Usage**:
   - Daily active users
   - Analyses per day
   - Average CVs per analysis
   - Credit consumption rate

2. **Performance**:
   - Analysis completion time (target: <2min for 10 CVs)
   - PDF generation time
   - API response times
   - Cache hit rates

3. **Costs**:
   - OpenAI API usage (GPT-4 is expensive!)
   - Supabase storage (PDF files)
   - Stripe transaction fees
   - Vercel bandwidth

4. **Errors**:
   - Failed analyses
   - Webhook delivery failures
   - Authentication issues
   - Payment failures

### Recommended Tools:
- **Sentry**: Error tracking (already configured in `sentry.*.config.ts`)
- **Vercel Analytics**: Traffic and performance
- **Supabase Dashboard**: Database metrics
- **Stripe Dashboard**: Payment metrics
- **OpenAI Usage Dashboard**: Token consumption

---

## 🔄 Post-Deployment Updates

### Immediate (Week 1):
- [ ] Monitor error rates and fix critical bugs
- [ ] Verify webhook delivery (check Stripe logs)
- [ ] Test all payment flows (subscription + one-time)
- [ ] Verify cache expiry logic works correctly
- [ ] Check OpenAI costs (GPT-4 kan være dyrt!)

### Short-term (Month 1):
- [ ] Gather user feedback
- [ ] Optimize AI prompts (reduce token usage if possible)
- [ ] Consider batch processing optimizations
- [ ] Add more analytics/tracking
- [ ] Implement admin dashboard (if needed)

### Future Enhancements (Backlog):
- [ ] Re-enable PDF validation (backend or more lenient)
- [ ] Add more job template features
- [ ] Export analysis results (Excel/CSV)
- [ ] Team collaboration features
- [ ] API access for enterprise customers
- [ ] Batch operations (bulk template application)

---

## 📞 Contact & Support

### Key Files for Reference:
- **Architecture**: `documentation/technical_architecture.md`
- **API Spec**: `documentation/api_specification.md`
- **Credits System**: `documentation/CREDITS_SYSTEM_COMPLETE.md`
- **Compare Mode**: `documentation/COMPARE_MODE_FEATURE.md`
- **Job Templates**: Feature 1 (documented in chat history)
- **Requirements Legend**: `documentation/PDF_REQUIREMENTS_LEGEND.md`

### Database Migrations:
- All SQL files in `database_migrations/`
- Run in alphabetical order for clean setup

### Environment Setup:
- Copy `env.example` to `.env.local` (local dev)
- Set `.env.production` variables in Vercel Dashboard

---

## ✅ Deployment Checklist Summary

**Before Deploy:**
- [ ] All database migrations run
- [ ] Storage bucket created
- [ ] Stripe products created and IDs updated
- [ ] Environment variables configured
- [ ] Code reviewed and tested locally

**Deploy:**
- [ ] Preview deployment tested
- [ ] Production deployment successful
- [ ] Stripe webhook endpoint verified

**After Deploy:**
- [ ] Authentication works
- [ ] Payment flows tested (test mode)
- [ ] Analysis + PDF generation works
- [ ] Compare Mode works
- [ ] Job Templates work
- [ ] Monitoring tools configured

**Go Live:**
- [ ] Switch Stripe to live mode
- [ ] Update webhook endpoint to use live keys
- [ ] Monitor errors for 24-48 hours
- [ ] Celebrate! 🎉

---

**Ready to deploy! 🚀**

Copy this entire prompt til din nye chat og start deployment planlægning.

