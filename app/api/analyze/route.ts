import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { PerformanceTimer } from '@/lib/performance'
import { createHash } from 'crypto'
import { CreditsService } from '@/lib/services/credits.service'
// Dynamisk import af pdf-parse for at undgå sideeffekter i bundling

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Performance: concurrency control for parallel processing (in-memory only)
const MAX_CONCURRENT_PROCESSING = 5 // Max parallel CV processing
const OPENAI_RETRY_ATTEMPTS = 3 // Retry failed OpenAI calls
const OPENAI_RETRY_DELAY = 1000 // Base delay between retries (ms)

// Cache configuration for CV analysis results
const CACHE_EXPIRY_HOURS = 24 // Cache analysis results for 24 hours

// NY REQUEST-MODEL (multipart):
// - analysisId: string (field)
// - requirements: string (JSON-encoded string[])
// - title: string (field, optional)
// - job: File (optional PDF)
// - jobText: string (optional – hvis klient allerede har udtrukket tekst)
// - cvs: File[] (flere PDF-filer)
type AnalyzeFormFields = {
  analysisId: string
  requirements: string[]
  title?: string
}

// OpenAI client oprettes inde i handleren efter validering af API key

// Simpel in-memory rate limiter (per process). Beskytter mod misbrug.
// Model: max 5 analyseruns per 10 minutter per bruger/IP.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX_RUNS = 5
type BucketKey = string
const rateBuckets: Map<BucketKey, number[]> = new Map()

function getClientIp(req: Request): string {
  const hdr = (name: string) => req.headers.get(name) || ''
  const xff = hdr('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const rip = hdr('x-real-ip')
  if (rip) return rip
  // Fallback i dev
  return 'local'
}

function allowRun(key: BucketKey): boolean {
  const now = Date.now()
  const arr = rateBuckets.get(key) || []
  const pruned = arr.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  if (pruned.length >= RATE_LIMIT_MAX_RUNS) {
    rateBuckets.set(key, pruned)
    return false
  }
  pruned.push(now)
  rateBuckets.set(key, pruned)
  return true
}

// Generate consistent cache key based on extracted CV text
// This ensures identical content + requirements combination gets cached results
// Includes robust input validation and error handling
function generateCacheKey(extractedText: string, requirements: string[], jobText: string): string {
  try {
    // Input validation
    if (typeof extractedText !== 'string') {
      throw new Error('extractedText must be a string')
    }
    
    if (!Array.isArray(requirements)) {
      throw new Error('requirements must be an array')
    }
    
    // Handle empty or invalid inputs
    const text = extractedText || ''
    const reqs = requirements.filter(r => typeof r === 'string' && r.trim().length > 0)
    
    // Normalize text by removing extra whitespace and lowercasing for consistent hashing
    const normalizedText = text.replace(/\s+/g, ' ').trim().toLowerCase()
    
    // Add job text normalization first (around line 84):
    const normalizedJobText = (jobText || '').replace(/\s+/g, ' ').trim().toLowerCase()
    
    // Sort requirements to ensure consistent key regardless of order
    const sortedRequirements = [...reqs].sort()
    
    // Create hash from normalized text + sorted requirements
    const hashInput = normalizedText + '|' + JSON.stringify(sortedRequirements) + '|' + normalizedJobText
    
    if (hashInput.length === 1) { // Only separator, no actual content
      throw new Error('No valid content to hash')
    }
    
    return createHash('sha256').update(hashInput, 'utf8').digest('hex')
  } catch (error: any) {
    console.warn('Cache key generation error:', error?.message || error)
    throw error // Re-throw to be handled by caller
  }
}

// Validate that cached result has the expected structure
function isValidCachedResult(data: any): boolean {
  try {
    // Check that data is an object with required properties
    if (!data || typeof data !== 'object') {
      return false
    }
    
    // Validate required fields exist and have correct types
    const hasValidOverall = typeof data.overall === 'number' && 
                           data.overall >= 0 && data.overall <= 10
    
    const hasValidScores = data.scores && 
                          typeof data.scores === 'object' && 
                          !Array.isArray(data.scores)
    
    const hasValidStrengths = Array.isArray(data.strengths)
    const hasValidConcerns = Array.isArray(data.concerns)
    
    // All validation checks must pass
    return hasValidOverall && hasValidScores && hasValidStrengths && hasValidConcerns
  } catch (error) {
    console.warn('Cache validation error:', error)
    return false
  }
}

// Check if we have cached results for this CV+requirements combination
// Includes robust error handling and corruption detection
async function getCachedResult(cacheKey: string): Promise<any | null> {
  try {
    const cutoffTime = new Date(Date.now() - (CACHE_EXPIRY_HOURS * 60 * 60 * 1000)).toISOString()
    
    const { data, error } = await supabaseAdmin
      .from('analysis_cache')
      .select('result_data, created_at')
      .eq('cache_key', cacheKey)
      .gte('created_at', cutoffTime)
      .limit(1)
      .single()
    
    // Handle database query errors
    if (error) {
      console.warn('Cache database query failed:', error?.message || error)
      return null
    }
    
    // No data found (cache miss)
    if (!data || !data.result_data) {
      return null
    }
    
    // Validate cached data structure to detect corruption
    if (!isValidCachedResult(data.result_data)) {
      console.warn('Corrupted cache entry detected, removing and falling back to AI processing:', {
        cacheKey: cacheKey.substring(0, 8) + '...', // Log partial key for debugging
        createdAt: data.created_at
      })
      
      // Attempt to clean up corrupted entry (non-blocking)
      try {
        await supabaseAdmin
          .from('analysis_cache')
          .delete()
          .eq('cache_key', cacheKey)
      } catch (deleteError) {
        console.warn('Failed to clean up corrupted cache entry:', deleteError)
      }
      
      return null
    }
    
    // Cache hit with valid data
    console.log(`✅ Valid cache entry found for key ${cacheKey.substring(0, 8)}...`)
    return data.result_data
    
  } catch (error: any) {
    // Catch-all error handler for any unexpected errors
    console.warn('Cache lookup failed with unexpected error:', {
      message: error?.message || 'Unknown error',
      code: error?.code || 'Unknown',
      cacheKey: cacheKey.substring(0, 8) + '...'
    })
    return null
  }
}

// Store analysis result in cache for future use
// Includes validation and robust error handling
async function setCachedResult(cacheKey: string, result: any): Promise<void> {
  try {
    // Validate that we're not caching invalid data
    if (!isValidCachedResult(result)) {
      console.warn('Attempted to cache invalid result structure, skipping cache storage:', {
        cacheKey: cacheKey.substring(0, 8) + '...',
        resultType: typeof result,
        hasOverall: result?.overall !== undefined,
        hasScores: result?.scores !== undefined
      })
      return
    }
    
    // Attempt to store in cache
    const { error } = await supabaseAdmin
      .from('analysis_cache')
      .upsert({
        cache_key: cacheKey,
        result_data: result,
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.warn('Cache storage database error:', {
        message: error.message || 'Unknown database error',
        code: error.code || 'Unknown',
        cacheKey: cacheKey.substring(0, 8) + '...'
      })
      return
    }
    
    console.log(`💾 Successfully cached result for key ${cacheKey.substring(0, 8)}...`)
    
  } catch (error: any) {
    // Non-critical - continue without failing the request
    // But log detailed error information for debugging
    console.warn('Cache storage failed with unexpected error:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack?.substring(0, 200) || 'No stack trace',
      cacheKey: cacheKey.substring(0, 8) + '...'
    })
  }
}

// Performance: Parallel processing helper function
async function processWithConcurrency<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  maxConcurrency: number
): Promise<R[]> {
  const results: R[] = []
  const executing: Promise<void>[] = []
  
  for (const [index, item] of items.entries()) {
    const promise = processor(item).then(result => {
      results[index] = result
    }).catch(error => {
      console.warn(`Processing failed for item ${index}:`, error?.message || error)
      // Return a fallback result instead of failing the entire batch
      results[index] = null as R
    })
    
    executing.push(promise)
    
    // Control concurrency - wait if we've reached max concurrent operations
    if (executing.length >= maxConcurrency) {
      await Promise.race(executing)
      // Remove completed promises
      executing.splice(executing.findIndex(p => 
        p === promise || 
        promise.then?.(() => true).catch?.(() => true)
      ), 1)
    }
  }
  
  // Wait for all remaining operations to complete
  await Promise.all(executing)
  return results
}

// Robusthed: OpenAI retry mechanism for resilience
async function callOpenAIWithRetry(
  openai: OpenAI, 
  messages: any[], 
  fileName: string,
  attempt: number = 1
): Promise<any> {
  try {
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages,
      response_format: { type: 'json_object' },
    })
    return resp
  } catch (error: any) {
    if (attempt >= OPENAI_RETRY_ATTEMPTS) {
      throw error
    }
    
    // Exponential backoff for retries
    const delayMs = OPENAI_RETRY_DELAY * Math.pow(2, attempt - 1)
    console.warn(`OpenAI call failed for ${fileName} (attempt ${attempt}), retrying in ${delayMs}ms...`)
    await new Promise(resolve => setTimeout(resolve, delayMs))
    
    return callOpenAIWithRetry(openai, messages, fileName, attempt + 1)
  }
}

async function extractPdfText(buf: ArrayBuffer): Promise<string> {
  try {
    if (!buf || (buf as ArrayBuffer).byteLength === 0) return ''
    const mod: any = await import('pdf2json')
    const PDFParser: any = mod?.default ?? mod
    return await new Promise<string>((resolve) => {
      try {
        const parser = new PDFParser()
        // Undertryk støjende warnings fra pdfjs/pdf2json (fake worker, Link, NOT valid form element)
        const originalWarn = console.warn
        const originalLog = console.log
        const originalStdout = (process.stdout.write as any)
        const originalStderr = (process.stderr.write as any)
        console.warn = () => {}
        console.log = () => {}
        ;(process.stdout.write as any) = (chunk: any, ...args: any[]) => {
          try {
            const str = typeof chunk === 'string' ? chunk : chunk?.toString?.()
            if (str && (str.includes('Unsupported: field.type of Link') || str.includes('NOT valid form element'))) {
              return true
            }
          } catch {}
          return originalStdout.call(process.stdout, chunk, ...args)
        }
        ;(process.stderr.write as any) = (chunk: any, ...args: any[]) => {
          try {
            const str = typeof chunk === 'string' ? chunk : chunk?.toString?.()
            if (str && (str.includes('Unsupported: field.type of Link') || str.includes('NOT valid form element'))) {
              return true
            }
          } catch {}
          return originalStderr.call(process.stderr, chunk, ...args)
        }
        let out = ''
        parser.on('pdfParser_dataError', () => {
          console.warn = originalWarn
          console.log = originalLog
          ;(process.stdout.write as any) = originalStdout
          ;(process.stderr.write as any) = originalStderr
          resolve('')
        })
        parser.on('pdfParser_dataReady', (pdfData: any) => {
          try {
            const pages = pdfData?.Pages || []
            for (const p of pages) {
              const texts = p?.Texts || []
              for (const t of texts) {
                const runs = t?.R || []
                for (const r of runs) {
                  out += decodeURIComponent(r?.T || '') + ' '
                }
              }
              out += '\n'
            }
            console.warn = originalWarn
            console.log = originalLog
            ;(process.stdout.write as any) = originalStdout
            ;(process.stderr.write as any) = originalStderr
            resolve(out.slice(0, 100_000))
          } catch {
            console.warn = originalWarn
            console.log = originalLog
            ;(process.stdout.write as any) = originalStdout
            ;(process.stderr.write as any) = originalStderr
            resolve('')
          }
        })
        parser.parseBuffer(Buffer.from(buf as ArrayBuffer))
      } catch {
        resolve('')
      }
    })
  } catch (e: any) {
    console.warn('PDF text extraction (pdf2json) failed:', e?.message || e)
    return ''
  }
}

// Resume generation prompts for Danish CV summaries
const resumeSystemPrompt = `Du laver strukturerede CV-resuméer på dansk. Følg nøjagtigt den angivne struktur og ordgrænse. 

VIGTIG: Du SKAL holde arbejdserfaring (jobroller) og uddannelse (formelle uddannelser) adskilt. Bland ALDRIG disse kategorier sammen.`;

const makeResumePrompt = (fileName: string, cvText: string) => {
  return `Lav et struktureret dansk resumé af denne kandidat på præcis 200 ord:

STRUKTUR:
**Profil:** [2-3 linjer - nuværende rolle og samlet erfaring]
**Nøgleerfaring:** [3-4 mest relevante ARBEJDSSTILLINGER med år og virksomhed - KUN joberfaring, IKKE uddannelse]
**Kernekompetencer:** [job-relevante færdigheder og teknologier]
**Uddannelse:** [KUN formelle uddannelser, degrees, kurser og certificeringer - KUN uddannelse, IKKE job-erfaring]
**Konkrete resultater:** [målbare achievements der understøtter kravene]

VIGTIGE REGLER FOR KATEGORISERING:
- **Nøgleerfaring**: Kun tidligere arbejdspladser, job-titler, ansættelsesperioder og virksomheder
- **Uddannelse**: Kun formelle uddannelser, universiteter, højskoler, kurser, certificeringer og akademiske kvalifikationer
- Bland ALDRIG arbejdserfaring og uddannelse sammen
- Arbejdsrollerne skal være under "Nøgleerfaring", uddannelserne under "Uddannelse"

FOKUS:
- Fremhæv erfaring der matcher stillingsopslaget
- Inkludér kun job-relevante information
- Brug konkrete tal og resultater hvor muligt
- Præcis 200 ord - ikke mere, ikke mindre
- Hold arbejdserfaring og uddannelse adskilt

UDELAD:
- Personlige oplysninger (alder, adresse, familie)
- Irrelevante hobbyer eller kurser
- Vage beskrivelser uden konkret indhold

KANDIDAT: ${fileName}
CV-INDHOLD: ${cvText}`;
};

// Generate resume for a candidate using OpenAI
// Includes retry logic and error handling to not break main analysis
async function generateResume(
  openai: OpenAI,
  fileName: string,
  cvText: string,
  attempt: number = 1
): Promise<string | null> {
  try {
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        { role: 'system', content: resumeSystemPrompt },
        { role: 'user', content: makeResumePrompt(fileName, cvText) }
      ],
      max_tokens: 400, // Limit for 200-word resume
    });

    const resumeText = resp.choices?.[0]?.message?.content?.trim() || '';
    
    // Basic validation - should contain some Danish resume structure markers
    if (resumeText.length < 100 || !resumeText.includes('**')) {
      throw new Error('Generated resume too short or missing structure');
    }

    return resumeText;
  } catch (error: any) {
    if (attempt >= OPENAI_RETRY_ATTEMPTS) {
      console.warn(`Resume generation failed for ${fileName} after ${attempt} attempts:`, error?.message || error);
      return null;
    }
    
    // Exponential backoff for retries
    const delayMs = OPENAI_RETRY_DELAY * Math.pow(2, attempt - 1);
    console.warn(`Resume generation failed for ${fileName} (attempt ${attempt}), retrying in ${delayMs}ms...`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    return generateResume(openai, fileName, cvText, attempt + 1);
  }
}

// Cache key for resume (separate from analysis cache)
function generateResumeCacheKey(candidateName: string, cvText: string): string {
  try {
    // Normalize inputs for consistent caching
    const normalizedName = (candidateName || '').trim().toLowerCase();
    const normalizedText = (cvText || '').replace(/\s+/g, ' ').trim().toLowerCase();
    
    const hashInput = `resume:${normalizedName}|${normalizedText}`;
    return createHash('sha256').update(hashInput, 'utf8').digest('hex');
  } catch (error: any) {
    console.warn('Resume cache key generation error:', error?.message || error);
    throw error;
  }
}

// Get cached resume if available
async function getCachedResume(cacheKey: string): Promise<string | null> {
  try {
    const cutoffTime = new Date(Date.now() - (CACHE_EXPIRY_HOURS * 60 * 60 * 1000)).toISOString();
    
    const { data, error } = await supabaseAdmin
      .from('resume_cache')
      .select('resume_text, created_at')
      .eq('cache_key', cacheKey)
      .gte('created_at', cutoffTime)
      .limit(1)
      .single();
    
    if (error || !data?.resume_text) {
      return null;
    }
    
    return data.resume_text;
  } catch (error: any) {
    console.warn('Resume cache lookup failed:', error?.message || error);
    return null;
  }
}

// Store generated resume in cache
async function setCachedResume(cacheKey: string, resumeText: string): Promise<void> {
  try {
    if (!resumeText || resumeText.length < 50) {
      console.warn('Attempted to cache invalid resume, skipping');
      return;
    }
    
    const { error } = await supabaseAdmin
      .from('resume_cache')
      .upsert({
        cache_key: cacheKey,
        resume_text: resumeText,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.warn('Resume cache storage failed:', error?.message || error);
    } else {
      console.log(`💾 Successfully cached resume for key ${cacheKey.substring(0, 8)}...`);
    }
  } catch (error: any) {
    console.warn('Resume cache storage error:', error?.message || error);
  }
}

// GDPR: Ekstraher kun kandidatens navn fra CV-teksten
// Simpel heuristik: kig i de første ~30 linjer efter tydelige navnemarkører eller store ordsekvenser
function extractCandidateNameFromText(cvText: string, fallbackName: string): string {
  try {
    const head = (cvText || '').split(/\r?\n/).slice(0, 30).join('\n')
    // Direkte markører som ofte forekommer i CV'er
    const labelMatch = head.match(/(?:navn|name)\s*[:\-]\s*([A-ZÆØÅ][^\n]{2,80})/i)
    if (labelMatch?.[1]) {
      const name = labelMatch[1].trim().replace(/\s{2,}/g, ' ')
      return name.slice(0, 120)
    }
    // Linje der ligner et navn (2-4 ord, starter med store bogstaver)
    const lines = head.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    for (const line of lines) {
      const words = line.split(/\s+/)
      const looksLikeName = words.length >= 2 && words.length <= 4 && words.every(w => /^(?:[A-ZÆØÅ][a-zæøåA-ZÆØÅ'\-]{1,})$/.test(w))
      if (looksLikeName) return line.slice(0, 120)
    }
    return fallbackName
  } catch {
    return fallbackName
  }
}

// GDPR: Ekstraher kun jobrelevant tekst fra CV'et
// Strategi: find afsnit/linjer som indeholder ord fra krav eller jobbeskrivelse. Fald tilbage til de første 1500 tegn.
function extractJobRelevantInfo(cvText: string, jobText: string, requirements: string[]): string {
  try {
    const normalized = (s: string) => (s || '').toLowerCase().normalize('NFKD')
    const cv = (cvText || '').slice(0, 120_000)
    const cvLines = cv.split(/\r?\n/)

    // Nøgleord fra krav (split ord og fjern korte ord)
    const reqWords = new Set(
      requirements
        .flatMap(r => r.split(/[^\p{L}\p{N}\-']+/u))
        .map(w => normalized(w))
        .filter(w => w.length >= 4)
    )
    // Et udvalg af nøgleord fra jobteksten (top 50 hyppigste ord >3 bogstaver)
    const jobWordsArr = (normalized(jobText).match(/[\p{L}\p{N}][\p{L}\p{N}\-']{3,}/gu) || [])
    const freq: Record<string, number> = {}
    for (const w of jobWordsArr) freq[w] = (freq[w] || 0) + 1
    const jobWords = new Set(Object.keys(freq).sort((a, b) => freq[b] - freq[a]).slice(0, 50))

    const selected: string[] = []
    for (const line of cvLines) {
      const low = normalized(line)
      let hit = false
      for (const w of reqWords) { if (low.includes(w)) { hit = true; break } }
      if (!hit) {
        for (const w of jobWords) { if (low.includes(w)) { hit = true; break } }
      }
      if (hit) selected.push(line)
      if (selected.join('\n').length > 4000) break
    }
    const excerpt = selected.join('\n').trim()
    if (excerpt.length >= 400) return excerpt.slice(0, 6000)
    // Fald tilbage: første 1500 tegn som et minimumsuddrag
    return cv.slice(0, 1500)
  } catch {
    return (cvText || '').slice(0, 1500)
  }
}

export async function POST(req: Request) {
  const timer = new PerformanceTimer()
  timer.mark('request-start')
  
  try {
    // VIGTIG GDPR-ÆNDRING: Vi accepterer nu multipart/form-data og behandler PDF'er i hukommelsen.
    const form = await req.formData().catch(() => null)
    if (!form) {
      return NextResponse.json({ ok: false, error: 'Expected multipart/form-data payload' }, { status: 400 })
    }

    const analysisId = String(form.get('analysisId') || '')
    if (!analysisId) {
      return NextResponse.json({ ok: false, error: 'Missing analysisId' }, { status: 400 })
    }
    const title = form.get('title') ? String(form.get('title')) : undefined
    let requirements: string[] = []
    const reqRaw = form.get('requirements')
    if (typeof reqRaw === 'string') {
      try { requirements = JSON.parse(reqRaw) } catch { requirements = [] }
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ ok: false, error: 'Missing OPENAI_API_KEY on server' }, { status: 500 })
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    
    // Authentication
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : undefined
    if (!token) {
      return NextResponse.json({ ok: false, error: 'Missing bearer token' }, { status: 401 })
    }
    const { data: userData, error: userErr }: any = await (supabaseAdmin as any).auth.getUser(token)
    if (userErr || !userData?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    const userId = userData.user.id as string

    // Rate limiting
    const ip = getClientIp(req)
    const userKey: BucketKey = `u:${userId}`
    const ipKey: BucketKey = `ip:${ip}`
    if (!allowRun(userKey) || !allowRun(ipKey)) {
      return NextResponse.json({ ok: false, error: 'For mange analyser. Prøv igen om lidt.' }, { status: 429 })
    }

    // Extract job description
    let jobText = ''
    const jobTextField = form.get('jobText')
    if (typeof jobTextField === 'string' && jobTextField.trim()) {
      jobText = jobTextField.slice(0, 50_000)
    } else {
      const jobFile = form.get('job')
      if (jobFile && typeof (jobFile as any).arrayBuffer === 'function') {
        try {
          const ab = await (jobFile as unknown as Blob).arrayBuffer()
          jobText = await extractPdfText(ab)
        } catch {}
      }
    }

    // Extract CV files
    const cvBlobs: Array<{ name: string; blob: Blob }> = []
    for (const [key, val] of form.entries()) {
      if (key === 'cvs' && val && typeof (val as any).arrayBuffer === 'function') {
        const fileLike = val as unknown as File
        const safeName = fileLike.name || 'cv.pdf'
        if (safeName.toLowerCase().endsWith('.pdf')) {
          cvBlobs.push({ name: safeName, blob: fileLike })
        }
      }
    }

    if (!cvBlobs.length) {
      return NextResponse.json({ ok: false, error: 'No CV files provided' }, { status: 400 })
    }

    // =====================================================
    // CREDIT SYSTEM INTEGRATION
    // Check and deduct credits BEFORE analysis starts
    // =====================================================
    
    const cvCount = cvBlobs.length
    
    // Step 1: Check if user has enough credits
    console.log(`💳 Checking credits for ${cvCount} CVs...`)
    const creditCheck = await CreditsService.hasEnoughCredits(userId, cvCount)
    
    if (!creditCheck.success) {
      // Database error checking credits - might be user doesn't have balance record yet
      console.warn('⚠️ Credit check failed, attempting to initialize balance...', creditCheck.error)
      
      // Try to initialize credit balance for this user
      const initResult = await CreditsService.initializeBalance(userId)
      
      if (initResult.success) {
        console.log('✅ Credit balance initialized for new user')
        
        // Retry credit check after initialization
        const retryCheck = await CreditsService.hasEnoughCredits(userId, cvCount)
        
        if (!retryCheck.success) {
          console.error('❌ Credit check still failed after initialization:', retryCheck.error)
          return NextResponse.json({ 
            ok: false, 
            error: 'Failed to check credit balance. Please contact support.' 
          }, { status: 500 })
        }
        
        // Use retry result for the rest of the flow
        if (!retryCheck.data.hasCredits) {
          console.warn(`⚠️ New user has insufficient credits: need ${retryCheck.data.required}, have ${retryCheck.data.currentBalance}`)
          return NextResponse.json({ 
            ok: false, 
            error: 'Insufficient credits',
            required: retryCheck.data.required,
            available: retryCheck.data.currentBalance,
            shortfall: retryCheck.data.shortfall,
            message: `Du mangler ${retryCheck.data.shortfall} credits. Du har ${retryCheck.data.currentBalance}, men skal bruge ${retryCheck.data.required}.`
          }, { status: 402 })
        }
        
        console.log(`✅ Credit check passed after initialization: ${retryCheck.data.currentBalance} credits available`)
      } else {
        // Failed to initialize - this is a real database error
        console.error('❌ Failed to initialize credit balance:', initResult.error)
        return NextResponse.json({ 
          ok: false, 
          error: 'Failed to check credit balance. Please contact support.' 
        }, { status: 500 })
      }
    } else if (!creditCheck.data.hasCredits) {
      // User doesn't have enough credits (and check was successful)
      console.warn(`⚠️ Insufficient credits: need ${creditCheck.data.required}, have ${creditCheck.data.currentBalance}`)
      return NextResponse.json({ 
        ok: false, 
        error: 'Insufficient credits',
        required: creditCheck.data.required,
        available: creditCheck.data.currentBalance,
        shortfall: creditCheck.data.shortfall,
        message: `Du mangler ${creditCheck.data.shortfall} credits. Du har ${creditCheck.data.currentBalance}, men skal bruge ${creditCheck.data.required}.`
      }, { status: 402 }) // 402 Payment Required
    } else {
      // Credit check passed - user has enough credits
      console.log(`✅ Credit check passed: ${creditCheck.data.currentBalance} credits available`)
    }
    
    // Step 2: Deduct credits BEFORE processing starts
    // This ensures users are charged before we do any expensive AI work
    console.log(`💳 Deducting ${cvCount} credits for analysis ${analysisId}...`)
    const deductResult = await CreditsService.deductCredits(userId, analysisId, cvCount)
    
    if (!deductResult.success) {
      // Deduction failed (shouldn't happen if check passed, but handle anyway)
      console.error('❌ Credit deduction failed:', deductResult.error)
      return NextResponse.json({ 
        ok: false, 
        error: 'Failed to deduct credits. Please try again.' 
      }, { status: 500 })
    }
    
    console.log(`✅ Deducted ${deductResult.data.deducted} credits. New balance: ${deductResult.data.balanceAfter}`)
    console.log(`   Transactions:`, deductResult.data.transactions.map(t => 
      `${t.amount} from ${t.creditType}`
    ).join(', '))
    
    // =====================================================
    // END CREDIT SYSTEM INTEGRATION
    // Processing will continue below. If it fails, credits will be auto-refunded.
    // =====================================================

    // OpenAI system prompt for CV analysis
    const sys = `Du er en dansk HR-analytiker. Vurder en kandidat ift. en jobbeskrivelse og MUST-HAVE krav. Returnér KUN JSON i dette schema:
{
  "name": "str",
  "overall": 0-10, // én decimal, beregnet som gennemsnit af (krav-score/10)
  "scores": {
    // nøglerne er de krav nedenfor
    "<krav1>": 0-100,
    "<krav2>": 0-100,
    // etc for alle krav
  },
  "strengths": ["str", ...], // 1-3 korte punkter
  "concerns": ["str", ...] // 0-3 korte punkter
}
Dansk sprog. Ingen ekstra tekst.`

    const makeUserPrompt = (fileName: string, cvText: string) => {
      const reqList = requirements.length ? requirements.join('\n- ') : '(ingen krav angivet)'
      return `FILNAVN: ${decodeURIComponent(fileName.replace(/\.pdf$/i, ''))}

[JOBBESKRIVELSE]
${jobText || '(ikke angivet)'}

[MUST-HAVE KRAV]
- ${reqList}

[CV]
${cvText || '(intet udtræk)'}`
    }

    console.log(`🚀 Starting CV analysis: ${cvBlobs.length} CVs, ${requirements.length} requirements`)

    // =====================================================
    // WRAP PROCESSING IN TRY-CATCH FOR AUTO-REFUND
    // If anything fails during processing, credits will be automatically refunded
    // =====================================================
    try {

    // Step 1: Extract PDF text in parallel
    timer.mark('extraction-start')
    const extractedData = await processWithConcurrency(
      cvBlobs,
      async ({ name, blob }) => {
        try {
          const ab = await blob.arrayBuffer()
          const fullText = await extractPdfText(ab)
          const candidateName = extractCandidateNameFromText(fullText, decodeURIComponent(name.replace(/\.pdf$/i, '')))
          const relevantExcerpt = extractJobRelevantInfo(fullText, jobText, requirements)
          return { name, candidateName, excerpt: relevantExcerpt }
        } catch (error) {
          console.warn(`PDF extraction failed for ${name}:`, error)
          return { name, candidateName: decodeURIComponent(name.replace(/\.pdf$/i, '')), excerpt: '' }
        }
      },
      MAX_CONCURRENT_PROCESSING
    )
    timer.mark('extraction-end')
    console.log(`🔍 PDF extraction completed in ${timer.getMarkDuration('extraction-start', 'extraction-end')}ms`)

    // Step 2: Process with OpenAI in parallel with cache lookup
    timer.mark('ai-start')
    const results = await processWithConcurrency(
      extractedData.filter(data => data !== null),
      async ({ name: fileName, candidateName, excerpt }) => {
        try {
          // Generate cache key
          let cacheKey: string | null = null
          try {
            cacheKey = generateCacheKey(excerpt, requirements, jobText)
          } catch (hashError) {
            console.warn(`Cache key generation failed for ${fileName}, proceeding with AI processing:`, hashError)
            cacheKey = null
          }

          // Check for cached result
          if (cacheKey) {
            try {
              const cachedResult = await getCachedResult(cacheKey)
              if (cachedResult) {
                console.log(`📋 Using cached result for ${fileName}`)
                if (isValidCachedResult(cachedResult)) {
                  return {
                    ...cachedResult,
                    name: candidateName
                  }
                } else {
                  console.warn(`Cached result validation failed for ${fileName}, falling back to AI processing`)
                }
              }
            } catch (cacheError) {
              console.warn(`Cache lookup failed for ${fileName}, falling back to AI processing:`, cacheError)
            }
          }

          console.log(`🤖 Processing ${fileName} with AI (no valid cache hit)`)

          // Use retry mechanism for better reliability
          const resp = await callOpenAIWithRetry(
            openai,
            [
              { role: 'system', content: sys },
              { role: 'user', content: makeUserPrompt(fileName, excerpt) },
            ],
            fileName
          )

          const raw = resp.choices?.[0]?.message?.content || ''
          let parsed: any | null = null
          try {
            parsed = JSON.parse(raw)
          } catch {
            const m = raw.match(/\{[\s\S]*\}/)
            if (m) {
              try {
                parsed = JSON.parse(m[0])
              } catch {}
            }
          }

          if (!parsed) throw new Error('Invalid AI response')

          // Normalize results
          const name = parsed.name || candidateName
          const scoresObj: Record<string, number> = parsed.scores || {}
          const normalizedScores: Record<string, number> = {}
          Object.keys(scoresObj).forEach((k) => {
            const n = Number(scoresObj[k])
            normalizedScores[k] = Math.max(0, Math.min(100, Number.isFinite(n) ? Math.round(n) : 0))
          })

          const overallNum = Number(parsed.overall)
          const overall = Math.max(0, Math.min(10, Number.isFinite(overallNum) ? Number(overallNum.toFixed(1)) : 0))

          const result = {
            name,
            overall,
            scores: normalizedScores,
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : [],
            concerns: Array.isArray(parsed.concerns) ? parsed.concerns.slice(0, 3) : [],
          }

          // Cache the result
          if (cacheKey && result) {
            try {
              const cacheableResult = { ...result, name: '' }
              await setCachedResult(cacheKey, cacheableResult)
            } catch (cacheStoreError) {
              console.warn(`Failed to cache result for ${fileName}:`, cacheStoreError)
            }
          }

          return result
        } catch (e: any) {
          console.warn('AI/parse failed for', fileName, e?.message || e)
          return {
            name: candidateName,
            overall: 0,
            scores: Object.fromEntries(requirements.map((r) => [r, 0])),
            strengths: [],
            concerns: ['Analyse mislykkedes for dette CV'],
          }
        }
      },
      MAX_CONCURRENT_PROCESSING
    )
    timer.mark('ai-end')
    console.log(`🤖 OpenAI processing completed in ${timer.getMarkDuration('ai-start', 'ai-end')}ms`)

    // Filter and sort results
    const validResults = results.filter(result => result !== null)
    validResults.sort((a, b) => b.overall - a.overall)

    // Create mapping between results and extracted data using the processing order
    // Since both arrays are processed in the same order, we can map by index
    const resultToExtractedMap = new Map()
    
    // Map each result to its corresponding extracted data by finding the best match
    validResults.forEach((result, resultIndex) => {
      let bestMatch: { name: string; candidateName: string; excerpt: string } | null = null
      let bestScore = 0
      
      extractedData.forEach((extracted, extractedIndex) => {
        if (!extracted || !extracted.excerpt) return
        
        // Type guard to ensure extracted has the right type
        const typedExtracted = extracted as { name: string; candidateName: string; excerpt: string }
        
        // Try multiple matching strategies
        const extractedName = extractCandidateNameFromText(typedExtracted.excerpt, decodeURIComponent(typedExtracted.name.replace(/\.pdf$/i, '')))
        const fileName = decodeURIComponent(typedExtracted.name.replace(/\.pdf$/i, ''))
        
        // Calculate match score
        let score = 0
        if (extractedName === result.name) score += 100  // Exact match
        if (fileName.toLowerCase().includes(result.name.toLowerCase())) score += 50
        if (result.name.toLowerCase().includes(extractedName.toLowerCase())) score += 50
        if (resultIndex === extractedIndex) score += 25  // Same position bonus
        
        if (score > bestScore) {
          bestScore = score
          bestMatch = typedExtracted
        }
      })
      
      if (bestMatch) {
        resultToExtractedMap.set(result.name, bestMatch)
        console.log(`🔗 Mapped ${result.name} to ${(bestMatch as any).name} (score: ${bestScore})`)
      } else {
        console.warn(`❌ No match found for ${result.name}`)
      }
    })

    // Generate final results with cv_text_hash (synchronous for immediate response)
    const finalResults = validResults.map((result, index) => {
      let cvTextHash = null
      
      const matchingExtracted = resultToExtractedMap.get(result.name)
      
      if (matchingExtracted && matchingExtracted.excerpt) {
        try {
          cvTextHash = createHash('sha256').update(matchingExtracted.excerpt, 'utf8').digest('hex')
          console.log(`✅ Generated hash for ${result.name}: ${cvTextHash.substring(0, 8)}...`)
        } catch (error) {
          console.warn(`Hash generation failed for ${result.name}:`, error)
        }
      } else {
        console.warn(`❌ No extracted data found for ${result.name}`)
      }
      
      return {
        ...result,
        cv_text_hash: cvTextHash
      }
    })

    timer.mark('request-end')
    timer.logSummary()

    console.log(`✅ CV analysis completed: ${finalResults.length}/${cvBlobs.length} CVs processed successfully`)

    // Optional database storage (non-blocking)
    setImmediate(async () => {
      try {
        await supabaseAdmin.from('analysis_results').insert(
          finalResults.map((r) => ({
            user_id: userId,
            analysis_id: analysisId,
            name: r.name,
            overall: r.overall,
            scores: r.scores,
            strengths: r.strengths,
            concerns: r.concerns,
            created_at: new Date().toISOString(),
            title: title ?? null,
          }))
        )
      } catch (e) {
        console.warn('DB insert failed:', (e as any)?.message)
      }
    })

    // Store CV text in cache for all candidates (for on-demand resume generation)
    setImmediate(async () => {
      try {
        console.log('💾 Storing CV text cache for on-demand resume generation...')
        
        for (const result of validResults) {
          const matchingExtracted = resultToExtractedMap.get(result.name)
          
          if (matchingExtracted && matchingExtracted.excerpt) {
            try {
              const cvTextHash = createHash('sha256').update(matchingExtracted.excerpt, 'utf8').digest('hex')
              
              // Store CV text for on-demand resume generation (30 days like reports)
              await supabaseAdmin.from('cv_text_cache').upsert({
                text_hash: cvTextHash,
                cv_text: matchingExtracted.excerpt,
                candidate_name: result.name,
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString()
              })
              
              console.log(`✅ CV text cached for ${result.name}`)
            } catch (error) {
              console.warn(`CV text caching failed for ${result.name}:`, error)
            }
          }
        }
      } catch (error) {
        console.warn('CV text caching failed:', error)
      }
    })

    // Return immediate response
    return NextResponse.json({
      ok: true,
      results: finalResults,
      performance: {
        totalTime: timer.getDuration(),
        processedCount: finalResults.length,
        totalCount: cvBlobs.length,
        extractionTime: timer.getMarkDuration('extraction-start', 'extraction-end'),
        aiProcessingTime: timer.getMarkDuration('ai-start', 'ai-end')
      }
    })

    // =====================================================
    // CATCH BLOCK: Auto-refund credits if processing failed
    // =====================================================
    } catch (processingError: any) {
      // Processing failed - refund the credits that were deducted
      console.error('❌ CV analysis processing failed:', processingError?.message || processingError)
      console.log('💳 Attempting to refund credits...')
      
      try {
        const refundResult = await CreditsService.refundAnalysis(
          userId,
          analysisId,
          cvCount,
          `Analysis failed: ${processingError?.message || 'Unknown error'}`
        )
        
        if (refundResult.success) {
          console.log(`✅ Successfully refunded ${refundResult.data.refunded} credits`)
          console.log(`   New balance: ${refundResult.data.balanceAfter}`)
        } else {
          // Refund failed - this is serious, log it prominently
          console.error('⚠️⚠️⚠️ CRITICAL: Credit refund failed!', refundResult.error)
          console.error('   User ID:', userId)
          console.error('   Analysis ID:', analysisId)
          console.error('   Amount to refund:', cvCount)
          console.error('   MANUAL INTERVENTION REQUIRED - Check credit_transactions table')
        }
      } catch (refundError: any) {
        // Refund attempt itself threw an error
        console.error('⚠️⚠️⚠️ CRITICAL: Refund attempt threw error!', refundError?.message || refundError)
        console.error('   User ID:', userId)
        console.error('   Analysis ID:', analysisId)
        console.error('   Amount to refund:', cvCount)
      }
      
      // Re-throw the original processing error
      // This ensures the user gets an error response
      throw processingError
    }
    // =====================================================
    // END TRY-CATCH BLOCK
    // =====================================================

  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'Unknown error' }, { status: 500 })
  }
}