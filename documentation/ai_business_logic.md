# AI Integration & Business Logic

## OpenAI Integration Strategy

### Single Multi-Step Prompt Approach
```typescript
// lib/openai/prompts.ts
export const CV_ANALYSIS_PROMPT = `
Du er en ekspert HR-konsulent, der skal vurdere kandidater mod specifikke jobkrav.

OPGAVE: Analyser dette CV mod de 3 udvalgte krav og giv en score fra 0-10 for hvert krav.

SCORING SKALA:
- 10: Strategisk/Ledende niveau - erfaring overstiger markant kravene
- 8-9: Dyb erfaring/Ekspertniveau - dyb og central erfaring
- 6-7: Solid & selvstændig erfaring - godt match, selvstændig
- 4-5: Praktisk grundlæggende erfaring - praktisk anvendelse, opfylder minimum
- 2-3: Begrænset/teoretisk erfaring - nævnt, men uden konkret anvendelse
- 0: Nul dokumentation - absolut intet bevis i CV'et

TRIN 1: Læs CV'et grundigt og identificer relevant erfaring
TRIN 2: For hvert krav, find konkrete beviser i CV'et
TRIN 3: Vurder erfaringsniveauet baseret på skalaen
TRIN 4: Giv en samlet vurdering

JOBKRAV:
{requirements}

CV INDHOLD:
{cv_content}

SVAR FORMAT:
{
  "candidate_name": "Fulde navn fra CV",
  "overall_score": gennemsnit af alle scores,
  "requirement_scores": [
    {
      "requirement_id": "req_1",
      "score": 0-10,
      "reasoning": "Specifik begrundelse med konkrete eksempler fra CV'et"
    }
  ]
}

Vær objektiv og konsistent i din vurdering. Sprog i CV'et er uden betydning - fokuser på indhold og fakta.
`

export function buildAnalysisPrompt(
  requirements: Requirement[],
  cvContent: string
): string {
  const requirementsText = requirements
    .map((req, idx) => `${idx + 1}. ${req.title}: ${req.description}`)
    .join('\n')
    
  return CV_ANALYSIS_PROMPT
    .replace('{requirements}', requirementsText)
    .replace('{cv_content}', cvContent)
}
```

### Job Description Analysis Prompt
```typescript
export const JOB_ANALYSIS_PROMPT = `
Analyser denne jobbekrivelse og identificer op til 7 vigtige krav/kvalifikationer.

FOKUSER PÅ:
- Konkrete færdigheder og kompetencer
- Erfaringskrav (år, type, niveau)
- Uddannelseskrav
- Personlige egenskaber kun hvis kritiske
- Certificeringer eller specifikke kvalifikationer

IGNORER:
- Virksomhedsbeskrivelser
- Generelle "nice to have" ting
- Standard krav som "god til at samarbejde"

JOBBEKRIVELSE:
{job_description}

SVAR FORMAT:
{
  "requirements": [
    {
      "id": "req_1",
      "title": "Kort præcis titel",
      "description": "Detaljeret beskrivelse af kravet",
      "importance": "critical" | "important" | "nice-to-have"
    }
  ]
}

Svar på dansk. Vær specifik og målbar i dine krav.
`
```

## AI Service Implementation

### Main Analysis Service
```typescript
// backend/lib/openai/analysis.ts
import OpenAI from 'openai'
import { z } from 'zod'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Response schemas for validation
const RequirementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  importance: z.enum(['critical', 'important', 'nice-to-have'])
})

const AnalysisResultSchema = z.object({
  candidate_name: z.string(),
  overall_score: z.number().min(0).max(10),
  requirement_scores: z.array(z.object({
    requirement_id: z.string(),
    score: z.number().min(0).max(10),
    reasoning: z.string()
  }))
})

export async function analyzeJobDescription(
  jobDescriptionText: string
): Promise<Requirement[]> {
  try {
    const prompt = JOB_ANALYSIS_PROMPT.replace(
      '{job_description}', 
      jobDescriptionText
    )
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower for consistency
      max_tokens: 2000
    })
    
    const result = JSON.parse(response.choices[0].message.content)
    
    // Validate response
    const validated = z.object({
      requirements: z.array(RequirementSchema)
    }).parse(result)
    
    return validated.requirements
  } catch (error) {
    logger.error('Job analysis failed:', error)
    throw new AppError('JOB_ANALYSIS_FAILED', 'Kunne ikke analysere jobbekrivelsen')
  }
}

export async function analyzeCV(
  cvText: string,
  requirements: Requirement[]
): Promise<AnalysisResult> {
  try {
    const prompt = buildAnalysisPrompt(requirements, cvText)
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2000
    })
    
    const result = JSON.parse(response.choices[0].message.content)
    
    // Validate and ensure consistency
    const validated = AnalysisResultSchema.parse(result)
    
    // Recalculate overall score to ensure accuracy
    const avgScore = validated.requirement_scores.reduce(
      (sum, score) => sum + score.score, 0
    ) / validated.requirement_scores.length
    
    validated.overall_score = Math.round(avgScore * 10) / 10
    
    return validated
  } catch (error) {
    logger.error('CV analysis failed:', error)
    throw new AppError('CV_ANALYSIS_FAILED', 'Kunne ikke analysere CV')
  }
}
```

### File Processing Service
```typescript
// backend/lib/openai/fileProcessing.ts
export async function extractTextFromPDF(
  fileStream: ReadableStream
): Promise<string> {
  try {
    // Upload to OpenAI Files API
    const file = await openai.files.create({
      file: fileStream,
      purpose: 'assistants'
    })
    
    // Use file with assistant or extraction
    // For now, we'll use a simple extraction approach
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Extract all text from this PDF file. Return only the text content, no formatting or analysis. File ID: ${file.id}`
      }],
      max_tokens: 4000
    })
    
    // Clean up
    await openai.files.del(file.id)
    
    return response.choices[0].message.content
  } catch (error) {
    logger.error('PDF extraction failed:', error)
    throw new AppError('PDF_EXTRACTION_FAILED', 'Kunne ikke læse PDF-filen')
  }
}
```

## Business Logic Implementation

### Analysis Workflow Service
```typescript
// backend/services/analysis.service.ts
export class AnalysisService {
  async createAnalysis(
    userId: string,
    jobTitle: string
  ): Promise<Analysis> {
    // Create analysis record
    const analysis = await supabase
      .from('analyses')
      .insert({
        user_id: userId,
        job_title: jobTitle,
        status: 'created'
      })
      .select()
      .single()
      
    return analysis.data
  }
  
  async processJobDescription(
    analysisId: string,
    fileId: string
  ): Promise<Requirement[]> {
    // Get file from storage
    const fileStream = await this.getFileStream(fileId)
    
    // Extract text
    const text = await extractTextFromPDF(fileStream)
    
    // Analyze with AI
    const requirements = await analyzeJobDescription(text)
    
    // Store requirements
    await supabase
      .from('analyses')
      .update({ 
        requirements: requirements,
        job_description_text: text,
        status: 'requirements_extracted'
      })
      .eq('id', analysisId)
      
    return requirements
  }
  
  async processCVBatch(
    analysisId: string,
    cvFileIds: string[],
    selectedRequirements: Requirement[]
  ): Promise<void> {
    // Update status
    await this.updateAnalysisStatus(analysisId, 'processing')
    
    // Process in parallel (max 5 concurrent)
    const results = await pLimit(5)(
      cvFileIds.map(fileId => async () => {
        try {
          const result = await this.processSingleCV(
            fileId,
            selectedRequirements
          )
          
          // Store result
          await this.storeCandidateResult(analysisId, result)
          
          // Update progress
          await this.updateProgress(analysisId, fileId)
          
          return result
        } catch (error) {
          logger.error(`Failed to process CV ${fileId}:`, error)
          // Continue with other CVs
        }
      })
    )
    
    // Mark as complete
    await this.updateAnalysisStatus(analysisId, 'completed')
  }
  
  private async processSingleCV(
    fileId: string,
    requirements: Requirement[]
  ): Promise<CandidateResult> {
    // Get file stream
    const fileStream = await this.getFileStream(fileId)
    
    // Extract text
    const cvText = await extractTextFromPDF(fileStream)
    
    // Analyze with AI
    const analysis = await analyzeCV(cvText, requirements)
    
    return {
      ...analysis,
      cv_file_id: fileId,
      processed_at: new Date()
    }
  }
}
```

### Progress Tracking
```typescript
// backend/services/progress.service.ts
export class ProgressService {
  private channels: Map<string, RealtimeChannel> = new Map()
  
  async trackAnalysis(analysisId: string, totalFiles: number) {
    // Create progress record
    await supabase
      .from('analysis_progress')
      .insert({
        analysis_id: analysisId,
        total_files: totalFiles,
        processed_files: 0
      })
      
    // Set up realtime channel
    const channel = supabase
      .channel(`analysis:${analysisId}`)
      .subscribe()
      
    this.channels.set(analysisId, channel)
  }
  
  async updateProgress(
    analysisId: string,
    currentFile: string
  ) {
    // Update database
    const { data } = await supabase
      .from('analysis_progress')
      .update({
        processed_files: sql`processed_files + 1`,
        current_file: currentFile,
        updated_at: new Date()
      })
      .eq('analysis_id', analysisId)
      .select()
      .single()
      
    // Broadcast update
    const channel = this.channels.get(analysisId)
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'progress',
        payload: {
          processed: data.processed_files,
          total: data.total_files,
          current_file: currentFile
        }
      })
    }
  }
  
  async completeAnalysis(analysisId: string) {
    // Clean up channel
    const channel = this.channels.get(analysisId)
    if (channel) {
      await channel.unsubscribe()
      this.channels.delete(analysisId)
    }
    
    // Broadcast completion
    await supabase
      .channel(`analysis:${analysisId}`)
      .send({
        type: 'broadcast',
        event: 'complete',
        payload: { analysis_id: analysisId }
      })
  }
}
```

### Error Handling & Retry Logic
```typescript
// backend/lib/utils/retry.ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number
    initialDelay: number
    maxDelay: number
    backoffFactor: number
  } = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2
  }
): Promise<T> {
  let lastError: Error
  let delay = options.initialDelay
  
  for (let attempt = 0; attempt < options.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on certain errors
      if (
        error.code === 'INVALID_API_KEY' ||
        error.code === 'QUOTA_EXCEEDED'
      ) {
        throw error
      }
      
      // Wait before retry
      if (attempt < options.maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay))
        delay = Math.min(delay * options.backoffFactor, options.maxDelay)
      }
    }
  }
  
  throw lastError!
}

// Usage in AI calls
export async function analyzeWithRetry(
  cvText: string,
  requirements: Requirement[]
): Promise<AnalysisResult> {
  return retryWithBackoff(
    () => analyzeCV(cvText, requirements),
    { maxRetries: 3, initialDelay: 2000 }
  )
}
```

### Cost Tracking
```typescript
// backend/services/usage.service.ts
export class UsageService {
  private readonly tokenPricing = {
    'gpt-4o-mini': {
      input: 0.00015 / 1000,  // $0.00015 per 1K tokens
      output: 0.0006 / 1000   // $0.0006 per 1K tokens
    }
  }
  
  async trackUsage(
    userId: string,
    model: string,
    inputTokens: number,
    outputTokens: number
  ) {
    const pricing = this.tokenPricing[model]
    const cost = (inputTokens * pricing.input) + 
                 (outputTokens * pricing.output)
    
    await supabase
      .from('usage_logs')
      .insert({
        user_id: userId,
        model,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: cost,
        created_at: new Date()
      })
  }
  
  async getMonthlyUsage(userId: string): Promise<UsageSummary> {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const { data } = await supabase
      .from('usage_logs')
      .select('cost_usd')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())
    
    const totalCost = data.reduce((sum, log) => sum + log.cost_usd, 0)
    
    return {
      total_cost_usd: totalCost,
      analyses_count: data.length
    }
  }
}
```

## Language Handling

Since the AI handles any language automatically, we only need to ensure:

1. **UI Language**: Danish as specified
2. **AI Prompts**: Danish for consistency
3. **Results**: Always returned in Danish regardless of CV language

```typescript
// The AI is instructed to always respond in Danish
// even when analyzing English, Swedish, or other language CVs
const LANGUAGE_INSTRUCTION = `
Svar altid på dansk, uanset hvilket sprog CV'et er skrevet på.
Analyser indholdet objektivt uanset sprog.
`
```