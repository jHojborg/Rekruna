# Performance & Scalability Specification

## PDF Processing Strategy (In-Memory)

### File Processing Implementation
```typescript
// backend/lib/pdf/processor.ts
export class PDFProcessor {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  
  async processFromStorage(
    bucket: string,
    filePath: string
  ): Promise<string> {
    try {
      // Download entire file to memory
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(filePath)
        
      if (error) throw error
      
      // Validate size
      if (data.size > this.MAX_FILE_SIZE) {
        throw new AppError(
          'FILE_TOO_LARGE',
          `Filen er for stor. Max størrelse: ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
        )
      }
      
      // Convert blob to buffer for OpenAI
      const buffer = await data.arrayBuffer()
      const file = new File([buffer], filePath, { type: 'application/pdf' })
      
      // Send to OpenAI for text extraction
      return await this.extractTextWithOpenAI(file)
      
    } catch (error) {
      logger.error('PDF processing failed', error)
      throw error
    }
  }
  
  private async extractTextWithOpenAI(file: File): Promise<string> {
    const openaiFile = await openai.files.create({
      file: file,
      purpose: 'assistants'
    })
    
    try {
      // Extract text using OpenAI
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Extract all text from the uploaded PDF. Return only the raw text content, maintaining structure but removing formatting. File ID: ${openaiFile.id}`
        }],
        max_tokens: 4000
      })
      
      return response.choices[0].message.content || ''
      
    } finally {
      // Always cleanup
      await openai.files.del(openaiFile.id)
    }
  }
}
```

### Memory Management
```typescript
// backend/lib/utils/memory.ts
export function checkMemoryUsage() {
  const used = process.memoryUsage()
  
  logger.info('Memory usage', {
    rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`
  })
  
  // Alert if using too much memory
  const heapUsedMB = used.heapUsed / 1024 / 1024
  if (heapUsedMB > 400) {
    logger.warn('High memory usage detected', { heapUsedMB })
  }
}

// Monitor memory in production
if (process.env.NODE_ENV === 'production') {
  setInterval(checkMemoryUsage, 60000) // Every minute
}
```

## Database Optimization

### Comprehensive Index Strategy
```sql
-- Users and authentication (handled by Supabase Auth)

-- Analyses table indexes
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_status ON analyses(status);
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX idx_analyses_user_status ON analyses(user_id, status);

-- Candidates table indexes
CREATE INDEX idx_candidates_analysis_id ON candidates(analysis_id);
CREATE INDEX idx_candidates_score ON candidates(overall_score DESC);
CREATE INDEX idx_candidates_analysis_score ON candidates(analysis_id, overall_score DESC);

-- Analysis progress indexes
CREATE INDEX idx_progress_analysis_id ON analysis_progress(analysis_id);

-- Error logs indexes (for monitoring)
CREATE INDEX idx_errors_timestamp ON error_logs(timestamp DESC);
CREATE INDEX idx_errors_level_timestamp ON error_logs(level, timestamp DESC);

-- Usage logs indexes
CREATE INDEX idx_usage_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_created_at ON usage_logs(created_at DESC);
CREATE INDEX idx_usage_user_date ON usage_logs(user_id, created_at DESC);

-- Partial indexes for common queries
CREATE INDEX idx_analyses_active ON analyses(user_id, created_at DESC) 
  WHERE status IN ('processing', 'created');

CREATE INDEX idx_analyses_completed ON analyses(user_id, created_at DESC) 
  WHERE status = 'completed';
```

### Optimized Queries
```typescript
// backend/services/dashboard.service.ts
export class DashboardService {
  async getUserDashboardData(userId: string) {
    // Single query with all needed data
    const { data, error } = await supabase.rpc('get_user_dashboard', {
      p_user_id: userId
    })
    
    if (error) throw error
    return data
  }
}

// Database function for efficient dashboard query
```

```sql
CREATE OR REPLACE FUNCTION get_user_dashboard(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'recent_analyses', (
      SELECT json_agg(
        json_build_object(
          'id', a.id,
          'job_title', a.job_title,
          'created_at', a.created_at,
          'status', a.status,
          'candidate_count', COUNT(c.id),
          'top_candidate', (
            SELECT json_build_object(
              'name', c2.name,
              'score', c2.overall_score
            )
            FROM candidates c2
            WHERE c2.analysis_id = a.id
            ORDER BY c2.overall_score DESC
            LIMIT 1
          )
        )
      )
      FROM analyses a
      LEFT JOIN candidates c ON c.analysis_id = a.id
      WHERE a.user_id = p_user_id
      GROUP BY a.id
      ORDER BY a.created_at DESC
      LIMIT 10
    ),
    'active_analysis', (
      SELECT json_build_object(
        'id', id,
        'job_title', job_title,
        'status', status
      )
      FROM analyses
      WHERE user_id = p_user_id 
      AND status IN ('created', 'processing')
      ORDER BY created_at DESC
      LIMIT 1
    ),
    'stats', (
      SELECT json_build_object(
        'total_analyses', COUNT(*),
        'total_candidates', (
          SELECT COUNT(*)
          FROM candidates c
          JOIN analyses a ON a.id = c.analysis_id
          WHERE a.user_id = p_user_id
        )
      )
      FROM analyses
      WHERE user_id = p_user_id
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

## Single Analysis Enforcement

### Frontend Implementation
```typescript
// lib/hooks/useAnalysisState.ts
export function useAnalysisState() {
  const [hasActiveAnalysis, setHasActiveAnalysis] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  
  // Check for active analysis on mount and periodically
  useEffect(() => {
    checkActiveAnalysis()
    
    // Poll every 5 seconds while analysis is active
    const interval = setInterval(() => {
      if (hasActiveAnalysis) {
        checkActiveAnalysis()
      }
    }, 5000)
    
    return () => clearInterval(interval)
  }, [hasActiveAnalysis])
  
  async function checkActiveAnalysis() {
    try {
      const { data } = await supabase
        .from('analyses')
        .select('id, status')
        .eq('user_id', user.id)
        .in('status', ['created', 'processing'])
        .single()
      
      setHasActiveAnalysis(!!data)
      setIsChecking(false)
      
    } catch (error) {
      setHasActiveAnalysis(false)
      setIsChecking(false)
    }
  }
  
  return { hasActiveAnalysis, isChecking, refetch: checkActiveAnalysis }
}
```

### UI Component with Disabled State
```typescript
// components/dashboard/QuickActions.tsx
export function QuickActions() {
  const { hasActiveAnalysis, isChecking } = useAnalysisState()
  const router = useRouter()
  
  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        onClick={() => router.push('/analysis/new')}
        disabled={hasActiveAnalysis || isChecking}
        className={cn(
          "quick-action-btn quick-action-btn-primary",
          (hasActiveAnalysis || isChecking) && "opacity-50 cursor-not-allowed"
        )}
      >
        <PlusCircle className="w-8 h-8 mb-2" />
        <span className="font-semibold">Ny Analyse</span>
        {hasActiveAnalysis && (
          <span className="text-sm text-gray-500 mt-1">
            En analyse kører allerede
          </span>
        )}
      </button>
      
      <button
        onClick={() => router.push('/history')}
        className="quick-action-btn"
      >
        <History className="w-8 h-8 mb-2" />
        <span className="font-semibold">Se Historik</span>
      </button>
    </div>
  )
}
```

### Backend Enforcement
```typescript
// backend/api/analysis/create.ts
export async function POST(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) throw new AuthError()
    
    // Check for existing active analysis
    const { data: activeAnalysis } = await supabase
      .from('analyses')
      .select('id')
      .eq('user_id', session.user.id)
      .in('status', ['created', 'processing'])
      .single()
    
    if (activeAnalysis) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'ANALYSIS_IN_PROGRESS',
            message: 'Du har allerede en analyse der kører. Vent venligst til den er færdig.'
          }
        },
        { status: 409 }
      )
    }
    
    // Create new analysis
    const data = await request.json()
    const analysis = await createAnalysis(session.user.id, data)
    
    return Response.json({ success: true, data: analysis })
    
  } catch (error) {
    return handleError(error)
  }
}
```

### Visual Feedback Component
```typescript
// components/analysis/ActiveAnalysisBar.tsx
export function ActiveAnalysisBar() {
  const { data: activeAnalysis } = useActiveAnalysis()
  
  if (!activeAnalysis) return null
  
  return (
    <div className="bg-blue-50 border-b border-blue-200 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-blue-900 font-medium">
            Analyserer: {activeAnalysis.job_title}
          </span>
        </div>
        
        <Link
          href={`/analysis/${activeAnalysis.id}`}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Se fremskridt →
        </Link>
      </div>
    </div>
  )
}
```

## Performance Monitoring

### API Response Time Tracking
```typescript
// middleware/performance.ts
export function performanceMiddleware(handler: Handler) {
  return async (request: Request) => {
    const start = Date.now()
    
    try {
      const response = await handler(request)
      const duration = Date.now() - start
      
      // Log slow requests
      if (duration > 3000) {
        logger.warn('Slow API request', {
          path: request.url,
          duration,
          method: request.method
        })
      }
      
      // Add timing header
      response.headers.set('X-Response-Time', `${duration}ms`)
      
      return response
      
    } catch (error) {
      const duration = Date.now() - start
      logger.error('Request failed', { duration, error })
      throw error
    }
  }
}
```

### Client-Side Performance
```typescript
// lib/hooks/usePerformance.ts
export function usePerformance(componentName: string) {
  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      if (renderTime > 100) {
        logger.warn(`Slow component render: ${componentName}`, {
          renderTime: Math.round(renderTime)
        })
      }
    }
  }, [componentName])
}
```

## Scalability Considerations for Future

### When to Upgrade Architecture
```typescript
// Document thresholds for scaling decisions
const SCALING_THRESHOLDS = {
  // Current limits (MVP)
  concurrent_users: 50,
  analyses_per_day: 500,
  storage_gb: 100,
  
  // When to consider upgrades
  upgrade_triggers: {
    memory_usage: '> 80% consistently',
    response_time: '> 5s for analysis',
    queue_depth: '> 100 pending analyses',
    error_rate: '> 1% of requests'
  },
  
  // Next steps
  scaling_path: [
    'Add Redis for caching',
    'Implement job queue (Bull/BullMQ)',
    'Move to streaming PDF processing',
    'Add read replicas for database',
    'Implement microservices architecture'
  ]
}
```

### Future Optimization Opportunities
```markdown
## Future Optimizations (Post-MVP)

1. **Caching Layer**
   - Redis for session management
   - Cache job requirements extraction
   - Cache user dashboard data

2. **Background Jobs**
   - Queue system for CV processing
   - Scheduled cleanup jobs
   - Email notifications

3. **Database Optimization**
   - Materialized views for reports
   - Partitioning for large tables
   - Connection pooling

4. **File Processing**
   - Stream processing for large files
   - CDN for PDF delivery
   - Compression for stored files

5. **Monitoring Upgrade**
   - APM tool (New Relic/DataDog)
   - Real user monitoring
   - Custom dashboards
```