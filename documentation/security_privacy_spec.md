# Security & Privacy Specification

## Authentication & Password Security

### Password Requirements
```typescript
// utils/validators/password.ts
export const passwordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?'
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Mindst 8 tegn')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Mindst ét stort bogstav')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Mindst ét lille bogstav')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Mindst ét tal')
  }
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('Mindst ét specialtegn')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
```

### Password UI Component
```typescript
// components/auth/PasswordInput.tsx
export function PasswordInput({ value, onChange }: PasswordInputProps) {
  const validation = validatePassword(value)
  
  return (
    <div>
      <Input
        type="password"
        value={value}
        onChange={onChange}
        className={validation.valid ? 'border-green-500' : ''}
      />
      <PasswordStrengthIndicator password={value} />
      <ul className="text-sm mt-2">
        <li className={hasUppercase ? 'text-green-600' : 'text-gray-400'}>
          ✓ Stort bogstav
        </li>
        {/* Additional requirements... */}
      </ul>
    </div>
  )
}
```

### Session Management
```typescript
// lib/auth/session.ts
export const sessionConfig = {
  accessTokenExpiry: '7d',    // 7 days
  refreshTokenExpiry: '30d',  // 30 days
  refreshThreshold: '1d',     // Refresh when < 1 day left
}

// Automatic token refresh
export function useAuthSession() {
  useEffect(() => {
    const interval = setInterval(async () => {
      const session = await supabase.auth.getSession()
      if (shouldRefresh(session)) {
        await supabase.auth.refreshSession()
      }
    }, 60000) // Check every minute
    
    return () => clearInterval(interval)
  }, [])
}
```

## GDPR Compliance (Minimal Implementation)

### 1. User Consent
```typescript
// components/auth/ConsentCheckbox.tsx
export function ConsentCheckbox({ checked, onChange }: ConsentProps) {
  return (
    <div className="flex items-start space-x-2">
      <Checkbox
        id="consent"
        checked={checked}
        onCheckedChange={onChange}
        required
      />
      <label htmlFor="consent" className="text-sm text-gray-600">
        Jeg accepterer <Link href="/privacy" className="underline">
          privatlivspolitikken
        </Link> og giver samtykke til behandling af mine data
      </label>
    </div>
  )
}

// Store consent in database
interface UserConsent {
  user_id: string
  consent_given: boolean
  consent_date: Date
  ip_address: string
}
```

### 2. Data Deletion
```typescript
// backend/services/gdpr.service.ts
export async function deleteUserData(userId: string) {
  // 1. Delete user's analyses
  await supabase
    .from('analyses')
    .delete()
    .eq('user_id', userId)
  
  // 2. Delete stored files
  const { data: files } = await supabase.storage
    .from('cvs')
    .list(userId)
  
  for (const file of files) {
    await supabase.storage
      .from('cvs')
      .remove([`${userId}/${file.name}`])
  }
  
  // 3. Delete user account
  await supabase.auth.admin.deleteUser(userId)
  
  // 4. Log deletion for compliance
  await logDeletion(userId)
}

// Automatic CV deletion after 30 days
export async function cleanupOldCVs() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { data: oldFiles } = await supabase
    .from('cv_files')
    .select('*')
    .lt('created_at', thirtyDaysAgo.toISOString())
  
  for (const file of oldFiles) {
    await supabase.storage
      .from('cvs')
      .remove([file.storage_path])
    
    await supabase
      .from('cv_files')
      .delete()
      .eq('id', file.id)
  }
}
```

### 3. Privacy Policy Page
```typescript
// app/privacy/page.tsx
export default function PrivacyPolicy() {
  return (
    <div className="prose max-w-4xl mx-auto p-8">
      <h1>Privatlivspolitik</h1>
      
      <h2>Databehandling</h2>
      <p>Vi behandler følgende persondata:</p>
      <ul>
        <li>Email og adgangskode (til din konto)</li>
        <li>CV-filer (slettes automatisk efter 30 dage)</li>
        <li>Analyseresultater (gemmes indtil du sletter dem)</li>
      </ul>
      
      <h2>Dine rettigheder</h2>
      <ul>
        <li>Ret til sletning af alle dine data</li>
        <li>Ret til at trække dit samtykke tilbage</li>
        <li>Ret til indsigt i dine data</li>
      </ul>
      
      <h2>Datasikkerhed</h2>
      <p>
        Alle data krypteres under transport (HTTPS) og gemmes sikkert 
        hos Supabase med encryption at rest.
      </p>
      
      <h2>Kontakt</h2>
      <p>
        For spørgsmål om dine data, kontakt: privacy@example.com
      </p>
    </div>
  )
}
```

## Security Headers & Configuration

### Next.js Security Headers
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim()
  }
]
```

### Environment Variable Security
```typescript
// lib/config/env.ts
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET'
]

// Validate on startup
export function validateEnv() {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`)
    }
  }
}

// Type-safe env access
export const env = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY!
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!
  }
}
```

## Input Validation & Sanitization

### File Upload Security
```typescript
// lib/validators/file.ts
export const fileValidation = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['application/pdf'],
  allowedExtensions: ['.pdf']
}

export function validateFile(file: File): ValidationResult {
  // Check size
  if (file.size > fileValidation.maxSize) {
    return { 
      valid: false, 
      error: 'Filen er for stor (max 10MB)' 
    }
  }
  
  // Check MIME type
  if (!fileValidation.allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Kun PDF-filer er tilladt' 
    }
  }
  
  // Check extension
  const ext = file.name.substring(file.name.lastIndexOf('.'))
  if (!fileValidation.allowedExtensions.includes(ext.toLowerCase())) {
    return { 
      valid: false, 
      error: 'Ugyldig filtype' 
    }
  }
  
  // Sanitize filename
  const sanitized = sanitizeFilename(file.name)
  
  return { valid: true, sanitizedName: sanitized }
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255)
}
```

### API Input Validation
```typescript
// lib/validators/api.ts
import { z } from 'zod'

export const schemas = {
  createAnalysis: z.object({
    job_title: z.string().min(3).max(200),
    job_description_file_id: z.string().uuid().optional()
  }),
  
  selectRequirements: z.object({
    requirement_ids: z.array(z.string().uuid()).max(3)
  }),
  
  email: z.string().email('Ugyldig email'),
  
  password: z.string().min(8).refine(
    (val) => validatePassword(val).valid,
    'Password skal opfylde alle krav'
  )
}

// Middleware for validation
export function validateRequest(schema: z.ZodSchema) {
  return async (req: Request) => {
    try {
      const body = await req.json()
      const validated = schema.parse(body)
      return validated
    } catch (error) {
      throw new ValidationError('Validation failed', error)
    }
  }
}
```

## Database Security

### Row Level Security (RLS) Policies
```sql
-- Enable RLS on all tables
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_files ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own analyses" ON analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analyses" ON analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses" ON analyses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses" ON analyses
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for other tables...

-- Storage policies
CREATE POLICY "Users can upload to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'cvs' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'cvs' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Error Handling & Logging

### Secure Error Messages
```typescript
// lib/errors/handler.ts
export function sanitizeError(error: unknown): ErrorResponse {
  // Don't expose internal errors to users
  if (error instanceof InternalError) {
    logger.error('Internal error:', error)
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'En fejl opstod. Prøv venligst igen.'
      }
    }
  }
  
  // Known errors can be shown
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    }
  }
  
  // Unknown errors
  logger.error('Unknown error:', error)
  return {
    success: false,
    error: {
      code: 'UNKNOWN_ERROR',
      message: 'Noget gik galt'
    }
  }
}
```

### Security Audit Logging
```typescript
// lib/audit/logger.ts
interface AuditLog {
  user_id: string
  action: string
  resource_type: string
  resource_id: string
  ip_address: string
  user_agent: string
  timestamp: Date
}

export async function logSecurityEvent(
  action: 'login' | 'logout' | 'delete_data' | 'export_data',
  userId: string,
  request: Request
) {
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    ip_address: getClientIp(request),
    user_agent: request.headers.get('user-agent'),
    timestamp: new Date()
  })
}
```