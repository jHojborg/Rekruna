# Testing & Deployment Guide

## Testing Strategy (MVP Focus)

### Component Testing with React Testing Library
```typescript
// frontend/__tests__/components/JobUpload.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { JobUpload } from '@/components/analysis/JobUpload'

describe('JobUpload', () => {
  it('accepts PDF files', () => {
    const onUpload = jest.fn()
    render(<JobUpload onUploadComplete={onUpload} />)
    
    const file = new File(['test'], 'job.pdf', { type: 'application/pdf' })
    const input = screen.getByLabelText(/upload/i)
    
    fireEvent.change(input, { target: { files: [file] } })
    
    expect(onUpload).toHaveBeenCalledWith(file)
  })
  
  it('rejects non-PDF files', () => {
    render(<JobUpload onUploadComplete={jest.fn()} />)
    
    const file = new File(['test'], 'job.docx', { type: 'application/docx' })
    const input = screen.getByLabelText(/upload/i)
    
    fireEvent.change(input, { target: { files: [file] } })
    
    expect(screen.getByText(/kun pdf/i)).toBeInTheDocument()
  })
})
```

### Critical E2E Tests with Playwright
```typescript
// e2e/critical-flows.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Critical User Flows', () => {
  test('complete analysis flow', async ({ page }) => {
    // 1. Login
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'Test123!')
    await page.click('button[type="submit"]')
    
    // 2. Start new analysis
    await expect(page).toHaveURL('/dashboard')
    await page.click('text=Ny Analyse')
    
    // 3. Upload job description
    const jobFile = 'test-files/job-description.pdf'
    await page.setInputFiles('input[type="file"]', jobFile)
    await expect(page.locator('text=Krav identificeret')).toBeVisible()
    
    // 4. Select requirements
    await page.check('input[type="checkbox"]', { nth: 0 })
    await page.check('input[type="checkbox"]', { nth: 1 })
    await page.check('input[type="checkbox"]', { nth: 2 })
    await page.click('text=Fortsæt')
    
    // 5. Upload CVs
    const cvFiles = [
      'test-files/cv1.pdf',
      'test-files/cv2.pdf'
    ]
    await page.setInputFiles('input[type="file"]', cvFiles)
    await page.click('text=Start Analyse')
    
    // 6. Wait for results
    await expect(page.locator('text=Analyse Færdig')).toBeVisible({
      timeout: 60000 // 1 minute max
    })
    
    // 7. Verify results displayed
    await expect(page.locator('.candidate-card')).toHaveCount(2)
  })
  
  test('subscription flow', async ({ page }) => {
    await page.goto('/pricing')
    await page.click('text=Start Abonnement')
    
    // Should redirect to Stripe
    await expect(page).toHaveURL(/stripe.com/)
  })
})
```

### Test Configuration
```javascript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
```

### Package.json Test Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

## Logging & Error Tracking

### Basic Error Logger
```typescript
// lib/logger/index.ts
type LogLevel = 'info' | 'warn' | 'error'

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  
  private async logToSupabase(
    level: LogLevel,
    message: string,
    data?: any
  ) {
    if (this.isDevelopment) return
    
    try {
      await supabase.from('error_logs').insert({
        level,
        message,
        data,
        timestamp: new Date(),
        environment: process.env.NODE_ENV,
        user_agent: typeof window !== 'undefined' 
          ? window.navigator.userAgent 
          : 'server'
      })
    } catch (err) {
      // Don't throw if logging fails
      console.error('Failed to log to Supabase:', err)
    }
  }
  
  info(message: string, data?: any) {
    console.log(`[INFO] ${message}`, data)
    this.logToSupabase('info', message, data)
  }
  
  warn(message: string, data?: any) {
    console.warn(`[WARN] ${message}`, data)
    this.logToSupabase('warn', message, data)
  }
  
  error(message: string, error?: any) {
    console.error(`[ERROR] ${message}`, error)
    
    // Extract useful error info
    const errorData = {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      ...error
    }
    
    this.logToSupabase('error', message, errorData)
  }
}

export const logger = new Logger()
```

### Error Logging Table
```sql
-- Create error logs table
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  timestamp TIMESTAMPTZ NOT NULL,
  environment TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick queries
CREATE INDEX idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX idx_error_logs_level ON error_logs(level);

-- Cleanup old logs (run periodically)
DELETE FROM error_logs WHERE timestamp < NOW() - INTERVAL '30 days';
```

### Usage in Application
```typescript
// Example: API route error handling
export async function POST(request: Request) {
  try {
    const data = await request.json()
    logger.info('Processing analysis request', { analysisId: data.id })
    
    const result = await processAnalysis(data)
    return Response.json(result)
    
  } catch (error) {
    logger.error('Analysis processing failed', error)
    
    return Response.json(
      { error: { code: 'PROCESSING_FAILED', message: 'Analysis failed' } },
      { status: 500 }
    )
  }
}

// Example: Frontend error boundary
export class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('React error boundary triggered', {
      error: error.toString(),
      componentStack: errorInfo.componentStack
    })
  }
}
```

## CI/CD with GitHub Actions & Vercel

### GitHub Repository Structure
```
.github/
├── workflows/
│   └── ci.yml
├── CODEOWNERS
└── pull_request_template.md
```

### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run linting
        run: npm run lint
      
      - name: Run component tests
        run: npm test
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: |
            test-results/
            playwright-report/
```

### Vercel Configuration
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["arn1"], // Stockholm for Danish users
  "functions": {
    "app/api/analysis/process.ts": {
      "maxDuration": 60
    }
  },
  "env": {
    "OPENAI_API_KEY": "@openai-api-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-key",
    "STRIPE_SECRET_KEY": "@stripe-secret-key",
    "STRIPE_WEBHOOK_SECRET": "@stripe-webhook-secret"
  }
}
```

### Environment Variables Setup
```bash
# Vercel CLI commands
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OPENAI_API_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
```

### Deployment Scripts
```json
// package.json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "dev": "next dev",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "pre-deploy": "npm run lint && npm run type-check && npm run test",
    "deploy": "vercel --prod"
  }
}
```

### Pre-deployment Checklist
```typescript
// scripts/pre-deploy-check.ts
const checks = [
  {
    name: 'Environment variables',
    test: () => {
      const required = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'OPENAI_API_KEY'
      ]
      return required.every(key => process.env[key])
    }
  },
  {
    name: 'Database migrations',
    test: async () => {
      // Check if migrations are up to date
      const { error } = await supabase.from('analyses').select('id').limit(1)
      return !error
    }
  },
  {
    name: 'Build succeeds',
    test: async () => {
      const { status } = await exec('npm run build')
      return status === 0
    }
  }
]

// Run all checks
async function runChecks() {
  for (const check of checks) {
    const passed = await check.test()
    console.log(`${check.name}: ${passed ? '✅' : '❌'}`)
    if (!passed) process.exit(1)
  }
}
```

## Monitoring Dashboard

### Simple Admin Dashboard
```typescript
// app/admin/page.tsx
export default async function AdminDashboard() {
  // Recent errors
  const { data: errors } = await supabase
    .from('error_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(20)
  
  // System stats
  const { data: stats } = await supabase
    .rpc('get_system_stats') // Custom function
  
  return (
    <div className="p-8">
      <h1>System Monitoring</h1>
      
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Analyses" value={stats.total_analyses} />
        <StatCard title="Active Users" value={stats.active_users} />
        <StatCard title="Errors (24h)" value={stats.errors_24h} />
      </div>
      
      <div className="bg-white p-6 rounded-lg">
        <h2>Recent Errors</h2>
        <ErrorLogTable errors={errors} />
      </div>
    </div>
  )
}
```

### Database Function for Stats
```sql
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_analyses', (SELECT COUNT(*) FROM analyses),
    'active_users', (
      SELECT COUNT(DISTINCT user_id) 
      FROM analyses 
      WHERE created_at > NOW() - INTERVAL '30 days'
    ),
    'errors_24h', (
      SELECT COUNT(*) 
      FROM error_logs 
      WHERE timestamp > NOW() - INTERVAL '24 hours'
    ),
    'avg_cvs_per_analysis', (
      SELECT AVG(candidate_count) 
      FROM analyses 
      WHERE status = 'completed'
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

## Rollback Strategy

### Quick Rollback with Vercel
```bash
# List recent deployments
vercel ls

# Rollback to previous version
vercel rollback [deployment-url]

# Or use Vercel dashboard for instant rollback
```

### Database Rollback
```sql
-- Always keep rollback scripts ready
-- Example: Rollback a schema change
BEGIN;
  -- Rollback changes
  ALTER TABLE analyses DROP COLUMN new_column;
  
  -- Verify
  SELECT * FROM analyses LIMIT 1;
  
  -- Commit only if correct
COMMIT;
-- or ROLLBACK; if issues
```