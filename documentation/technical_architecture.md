# Technical Architecture - Node.js Backend

## Overview
The application uses a unified Node.js architecture with Next.js API routes handling all backend operations. This eliminates the need for a separate backend service and simplifies deployment.

## Core Architecture Flow

### 1. PDF Processing Pipeline
```
Supabase Storage → Node.js API Route → OpenAI Files API → Supabase PostgreSQL
```

**Detailed Flow:**
1. User uploads CVs to Supabase Storage via Next.js frontend
2. Next.js API route receives processing request
3. API route streams PDF directly from Supabase Storage
4. Stream is piped to OpenAI Files API for processing
5. OpenAI extracts text and returns structured data
6. API route sends extracted text to OpenAI Chat Completions for analysis
7. Results are stored in Supabase PostgreSQL
8. Real-time updates sent via Supabase Realtime

### 2. Key Technical Components

#### API Routes Structure
```
/api/
├── auth/
│   ├── login.ts
│   └── logout.ts
├── analysis/
│   ├── create.ts         # Create new analysis session
│   ├── upload-job.ts     # Handle job description upload
│   ├── upload-cvs.ts     # Handle CV batch upload
│   ├── process.ts        # Main processing endpoint
│   └── status.ts         # Get analysis status
└── reports/
    └── generate.ts       # Generate PDF report
```

#### Streaming Implementation
```typescript
// Example: Stream PDF from Supabase to OpenAI
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

export async function streamPdfToOpenAI(filePath: string) {
  const supabase = createClient(...)
  const openai = new OpenAI(...)
  
  // Download stream from Supabase Storage
  const { data: fileStream } = await supabase.storage
    .from('cvs')
    .download(filePath)
  
  // Upload to OpenAI Files API
  const file = await openai.files.create({
    file: fileStream,
    purpose: 'assistants'
  })
  
  return file
}
```

### 3. Database Schema

#### Tables
```sql
-- Analysis sessions
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  job_title TEXT NOT NULL,
  job_description_file TEXT,
  requirements JSONB NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Candidate results
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cv_file TEXT NOT NULL,
  overall_score DECIMAL(3,1) CHECK (overall_score >= 0 AND overall_score <= 10),
  requirement_scores JSONB NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time progress tracking
CREATE TABLE analysis_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  total_files INTEGER NOT NULL,
  processed_files INTEGER DEFAULT 0,
  current_file TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. OpenAI Integration

#### Model Selection
- **Model**: GPT-4o-mini
- **Rationale**: Cost-effective while maintaining high quality analysis
- **Usage**: 
  - Job description analysis and requirement extraction
  - CV content analysis and scoring
  - Generating detailed reasoning for scores

#### API Flow
```typescript
// 1. Extract requirements from job description
const requirementsPrompt = `
Analyze this job description and extract up to 7 key requirements.
Focus on measurable skills, experience, and qualifications.
Return as JSON array with title and description for each requirement.
`;

// 2. Analyze CV against requirements
const analysisPrompt = `
Score this CV against these 3 requirements using a 0-10 scale:
- 10: Strategic/Leading level - exceeds requirements
- 8-9: Deep experience/Expert level
- 6-7: Solid & independent experience
- 4-5: Basic practical experience
- 2-3: Limited/theoretical knowledge
- 0: No documentation

Provide detailed reasoning with specific examples from CV.
`;
```

#### No Caching Strategy
- Fresh analysis for every run
- Ensures up-to-date evaluation
- Simplifies architecture
- Aligns with user behavior (unlikely to analyze same CV/job multiple times)
```typescript
// Publish progress updates
await supabase
  .from('analysis_progress')
  .update({ 
    processed_files: processedCount,
    current_file: currentFileName 
  })
  .eq('analysis_id', analysisId)
```

### 5. Subscription & Payment Integration

#### Stripe Payment Links
- **Model**: Monthly subscription with unlimited analyses
- **Implementation**: Stripe Payment Links (no complex checkout flow)
- **Webhook**: Handle subscription status updates
- **User Status**: Track in database (active, trial, cancelled)

#### Subscription Flow
1. User clicks "Subscribe" → Redirect to Stripe Payment Link
2. Stripe handles payment → Webhook updates user status
3. User redirected back → Full access granted
4. Monthly billing handled by Stripe

### 6. Data Retention Policy

#### CV Files
- **Retention**: 60 days (GDPR compliant)
- **Auto-cleanup**: Daily cron job via Supabase Edge Functions
- **Implementation**:
```typescript
// Cleanup function runs daily
export async function cleanupOldCVs() {
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
  
  // Delete CVs older than 60 days
  await supabase.storage
    .from('cvs')
    .list()
    .then(files => {
      // Filter and delete old files
    })
}
```

#### Analysis Results
- **Retention**: Indefinite (until user deletes)
- **Storage**: PostgreSQL with JSONB for flexibility
- **User Control**: Delete individual analyses or all data

### 7. Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini # Cost-effective model for analysis

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
MAX_CV_UPLOAD=50
MAX_FILE_SIZE_MB=10
```

### 8. Security Considerations
- Row Level Security (RLS) on all tables
- Service role key only used server-side
- File uploads validated for type and size
- Rate limiting on API routes
- Sanitization of file names and content

### 9. Performance Optimizations
- Parallel processing of CVs (up to 5 concurrent)
- Streaming for large files (no memory overhead)
- Database connection pooling
- Progress updates batched for efficiency
- Optimized prompts for GPT-4o-mini

### 10. Error Handling
- Retry logic for OpenAI API calls
- Graceful degradation if file processing fails
- Detailed error logging to Supabase
- User-friendly error messages
- Automatic cleanup of orphaned files