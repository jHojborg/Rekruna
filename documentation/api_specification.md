# API Specification & Endpoints

## Base Configuration

### API Structure
```
https://app.example.com/api/v1/
├── /auth
├── /analysis
├── /reports
├── /subscription
└── /user
```

### Standard Response Format

#### Success Response
```typescript
interface SuccessResponse<T> {
  success: true
  data: T
  meta?: {
    page?: number
    limit?: number
    total?: number
  }
}
```

#### Error Response
```typescript
interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, any>
  }
}
```

### Error Codes
```typescript
enum ErrorCode {
  // Authentication
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  
  // Authorization
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SUBSCRIPTION_REQUIRED = 'SUBSCRIPTION_REQUIRED',
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
  
  // Validation
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Processing
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  OPENAI_ERROR = 'OPENAI_ERROR',
  
  // General
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}
```

## Rate Limiting

### Implementation
```typescript
// middleware/rateLimit.ts
interface RateLimitConfig {
  windowMs: number  // 1 minute
  max: number       // 100 requests
  message: string
  standardHeaders: boolean
  legacyHeaders: boolean
}

// Headers returned
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200000
```

### Rate Limit Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 60 seconds.",
    "details": {
      "retryAfter": 60,
      "limit": 100,
      "remaining": 0,
      "reset": 1640995200000
    }
  }
}
```

## Authentication Endpoints

### POST /api/v1/auth/login
```typescript
// Request
interface LoginRequest {
  email: string
  password: string
}

// Response
interface LoginResponse {
  user: {
    id: string
    email: string
    subscription_status: 'trial' | 'active' | 'cancelled' | 'expired'
    subscription_ends_at: string | null
  }
  session: {
    access_token: string
    refresh_token: string
    expires_at: number
  }
}

// Error Example
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID",
    "message": "Invalid email or password"
  }
}
```

### POST /api/v1/auth/logout
```typescript
// No body required
// Response: 204 No Content
```

### POST /api/v1/auth/refresh
```typescript
// Request
interface RefreshRequest {
  refresh_token: string
}

// Response: Same as login response
```

## Analysis Endpoints

### POST /api/v1/analysis/create
```typescript
// Request
interface CreateAnalysisRequest {
  job_title: string
  job_description_file_id?: string  // If already uploaded
}

// Response
interface CreateAnalysisResponse {
  analysis_id: string
  status: 'created'
  created_at: string
}
```

### POST /api/v1/analysis/:id/upload-job
```typescript
// Request
interface UploadJobRequest {
  filename: string
  file_size: number
  mime_type: string
}

// Response - Presigned URL
interface UploadJobResponse {
  upload_url: string
  file_id: string
  expires_at: number
  headers: {
    'Content-Type': string
    'Content-Length': string
  }
}

// Client then uploads directly:
// PUT upload_url with file content
```

### POST /api/v1/analysis/:id/extract-requirements
```typescript
// Request
interface ExtractRequirementsRequest {
  file_id: string
}

// Response
interface ExtractRequirementsResponse {
  requirements: Array<{
    id: string
    title: string
    description: string
    importance: 'critical' | 'important' | 'nice-to-have'
  }>
}
```

### POST /api/v1/analysis/:id/select-requirements
```typescript
// Request
interface SelectRequirementsRequest {
  requirement_ids: string[]  // Max 3
}

// Response
interface SelectRequirementsResponse {
  analysis_id: string
  selected_requirements: string[]
  status: 'requirements_selected'
}
```

### POST /api/v1/analysis/:id/upload-cvs
```typescript
// Request
interface UploadCVsRequest {
  files: Array<{
    filename: string
    file_size: number
    mime_type: string
  }>
}

// Response - Multiple presigned URLs
interface UploadCVsResponse {
  uploads: Array<{
    filename: string
    upload_url: string
    file_id: string
    expires_at: number
  }>
}
```

### POST /api/v1/analysis/:id/process
```typescript
// Request
interface ProcessAnalysisRequest {
  cv_file_ids: string[]
}

// Response
interface ProcessAnalysisResponse {
  analysis_id: string
  status: 'processing'
  total_cvs: number
  estimated_time_seconds: number
}
```

### GET /api/v1/analysis/:id/status
```typescript
// Response
interface AnalysisStatusResponse {
  analysis_id: string
  status: 'created' | 'processing' | 'completed' | 'failed'
  progress: {
    total: number
    processed: number
    current_file?: string
  }
  error?: {
    code: string
    message: string
  }
}
```

### GET /api/v1/analysis/:id/results
```typescript
// Response
interface AnalysisResultsResponse {
  analysis_id: string
  job_title: string
  completed_at: string
  candidates: Array<{
    id: string
    name: string
    overall_score: number
    cv_file_id: string
    requirement_scores: Array<{
      requirement_id: string
      requirement_title: string
      score: number
      reasoning: string
    }>
  }>
}
```

### GET /api/v1/analysis
```typescript
// Query params
interface ListAnalysesQuery {
  page?: number
  limit?: number
  status?: string
}

// Response
interface ListAnalysesResponse {
  analyses: Array<{
    id: string
    job_title: string
    created_at: string
    completed_at?: string
    status: string
    candidate_count: number
    top_candidate?: {
      name: string
      score: number
    }
  }>
  meta: {
    page: number
    limit: number
    total: number
  }
}
```

## Report Endpoints

### POST /api/v1/reports/generate
```typescript
// Request
interface GenerateReportRequest {
  analysis_id: string
  format: 'pdf'
  language: 'da' | 'en'
}

// Response - Presigned download URL
interface GenerateReportResponse {
  download_url: string
  expires_at: number
  file_size: number
}
```

## Subscription Endpoints

### POST /api/v1/subscription/create-checkout
```typescript
// Request
interface CreateCheckoutRequest {
  price_id: string
  success_url: string
  cancel_url: string
}

// Response
interface CreateCheckoutResponse {
  checkout_url: string
  session_id: string
}
```

### GET /api/v1/subscription/status
```typescript
// Response
interface SubscriptionStatusResponse {
  status: 'trial' | 'active' | 'cancelled' | 'expired'
  current_period_end?: string
  cancel_at_period_end?: boolean
  trial_ends_at?: string
}
```

### POST /api/v1/subscription/webhook
```typescript
// Stripe webhook endpoint
// Handles: checkout.session.completed, customer.subscription.updated, etc.
```

## User Endpoints

### GET /api/v1/user/profile
```typescript
// Response
interface UserProfileResponse {
  id: string
  email: string
  created_at: string
  subscription: {
    status: string
    current_period_end?: string
  }
  usage: {
    analyses_this_month: number
    total_analyses: number
    last_analysis_at?: string
  }
}
```

### DELETE /api/v1/user/data
```typescript
// GDPR compliance - delete all user data
// Response: 204 No Content
```

## File Upload Flow Example

```typescript
// 1. Client requests presigned URL
const { upload_url, file_id } = await api.post('/analysis/123/upload-job', {
  filename: 'job_description.pdf',
  file_size: 1024000,
  mime_type: 'application/pdf'
})

// 2. Client uploads directly to Supabase
await fetch(upload_url, {
  method: 'PUT',
  body: file,
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Length': '1024000'
  }
})

// 3. Client notifies backend of completion
await api.post('/analysis/123/extract-requirements', {
  file_id: file_id
})
```

## WebSocket Events (via Supabase Realtime)

### Channel: `analysis:{analysis_id}`

#### Events
```typescript
// Progress Update
{
  type: 'progress',
  data: {
    processed: 5,
    total: 20,
    current_file: 'John_Doe_CV.pdf'
  }
}

// Candidate Processed
{
  type: 'candidate_processed',
  data: {
    name: 'John Doe',
    score: 8.5,
    file_id: 'abc123'
  }
}

// Analysis Complete
{
  type: 'complete',
  data: {
    analysis_id: '123',
    candidate_count: 20
  }
}

// Error
{
  type: 'error',
  data: {
    code: 'PROCESSING_FAILED',
    message: 'Failed to process CV'
  }
}
```

## Error Handling Examples

### Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Request validation failed",
    "details": {
      "fields": {
        "requirement_ids": "Maximum 3 requirements allowed"
      }
    }
  }
}
```

### File Upload Error
```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds 10MB limit",
    "details": {
      "max_size": 10485760,
      "provided_size": 15728640
    }
  }
}
```

### OpenAI Error
```json
{
  "success": false,
  "error": {
    "code": "OPENAI_ERROR",
    "message": "AI analysis temporarily unavailable",
    "details": {
      "retry_after": 30
    }
  }
}
```