import { supabaseAdmin } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { PerformanceTimer } from '@/lib/performance'
import { createHash } from 'crypto'
import { CreditsService } from '@/lib/services/credits.service'
import { anonymizeCVText } from '@/lib/anonymization'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Increase timeout for streaming analysis (can take time with multiple CVs)
// NOTE: If using Hobby plan, this will cause timeout errors - upgrade to Pro recommended
export const maxDuration = 60 // 60 seconds (requires Vercel Pro or higher)

// SSE helper to send events to client
// Formats data as Server-Sent Events protocol
function sendSSE(controller: ReadableStreamDefaultController, event: string, data: any) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  controller.enqueue(new TextEncoder().encode(message))
}

// Performance and cache configuration
const MAX_CONCURRENT_PROCESSING = 5
const OPENAI_RETRY_ATTEMPTS = 3
const OPENAI_RETRY_DELAY = 1000
const CACHE_EXPIRY_HOURS = 24

// Rate limiting (in-memory per process)
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

// Cache key generation for CV analysis
function generateCacheKey(extractedText: string, requirements: string[], jobText: string): string {
  try {
    if (typeof extractedText !== 'string') {
      throw new Error('extractedText must be a string')
    }
    if (!Array.isArray(requirements)) {
      throw new Error('requirements must be an array')
    }
    
    const text = extractedText || ''
    const reqs = requirements.filter(r => typeof r === 'string' && r.trim().length > 0)
    const normalizedText = text.replace(/\s+/g, ' ').trim().toLowerCase()
    const normalizedJobText = (jobText || '').replace(/\s+/g, ' ').trim().toLowerCase()
    const sortedRequirements = [...reqs].sort()
    const hashInput = normalizedText + '|' + JSON.stringify(sortedRequirements) + '|' + normalizedJobText
    
    if (hashInput.length === 1) {
      throw new Error('No valid content to hash')
    }
    
    return createHash('sha256').update(hashInput, 'utf8').digest('hex')
  } catch (error: any) {
    console.warn('Cache key generation error:', error?.message || error)
    throw error
  }
}

// Validate cached result structure
function isValidCachedResult(data: any): boolean {
  try {
    if (!data || typeof data !== 'object') {
      return false
    }
    const hasValidOverall = typeof data.overall === 'number' && 
                           data.overall >= 0 && data.overall <= 10
    const hasValidScores = data.scores && 
                          typeof data.scores === 'object' && 
                          !Array.isArray(data.scores)
    const hasValidStrengths = Array.isArray(data.strengths)
    const hasValidConcerns = Array.isArray(data.concerns)
    
    return hasValidOverall && hasValidScores && hasValidStrengths && hasValidConcerns
  } catch (error) {
    console.warn('Cache validation error:', error)
    return false
  }
}

// Check cache for existing result
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
    
    if (error || !data || !data.result_data) {
      return null
    }
    
    if (!isValidCachedResult(data.result_data)) {
      console.warn('Corrupted cache entry detected, removing:', cacheKey.substring(0, 8) + '...')
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
    
    console.log(`✅ Valid cache entry found for key ${cacheKey.substring(0, 8)}...`)
    return data.result_data
    
  } catch (error: any) {
    console.warn('Cache lookup failed:', error?.message || 'Unknown error')
    return null
  }
}

// Store result in cache
async function setCachedResult(cacheKey: string, result: any): Promise<void> {
  try {
    if (!isValidCachedResult(result)) {
      console.warn('Attempted to cache invalid result structure, skipping')
      return
    }
    
    const { error } = await supabaseAdmin
      .from('analysis_cache')
      .upsert({
        cache_key: cacheKey,
        result_data: result,
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.warn('Cache storage database error:', error.message || 'Unknown')
      return
    }
    
    console.log(`💾 Successfully cached result for key ${cacheKey.substring(0, 8)}...`)
  } catch (error: any) {
    console.warn('Cache storage failed:', error?.message || 'Unknown error')
  }
}

// OpenAI retry mechanism
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
    
    const delayMs = OPENAI_RETRY_DELAY * Math.pow(2, attempt - 1)
    console.warn(`OpenAI call failed for ${fileName} (attempt ${attempt}), retrying in ${delayMs}ms...`)
    await new Promise(resolve => setTimeout(resolve, delayMs))
    
    return callOpenAIWithRetry(openai, messages, fileName, attempt + 1)
  }
}

// PDF text extraction
async function extractPdfText(buf: ArrayBuffer): Promise<string> {
  try {
    if (!buf || (buf as ArrayBuffer).byteLength === 0) return ''
    const mod: any = await import('pdf2json')
    const PDFParser: any = mod?.default ?? mod
    return await new Promise<string>((resolve) => {
      try {
        const parser = new PDFParser()
        // Suppress noisy warnings from pdf2json
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
    console.warn('PDF text extraction failed:', e?.message || e)
    return ''
  }
}

// Extract candidate name from CV text
function extractCandidateNameFromText(cvText: string, fallbackName: string): string {
  try {
    const head = (cvText || '').split(/\r?\n/).slice(0, 30).join('\n')
    const labelMatch = head.match(/(?:navn|name)\s*[:\-]\s*([A-ZÆØÅ][^\n]{2,80})/i)
    if (labelMatch?.[1]) {
      const name = labelMatch[1].trim().replace(/\s{2,}/g, ' ')
      return name.slice(0, 120)
    }
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

// Extract job-relevant info from CV
function extractJobRelevantInfo(cvText: string, jobText: string, requirements: string[]): string {
  try {
    const normalized = (s: string) => (s || '').toLowerCase().normalize('NFKD')
    const cv = (cvText || '').slice(0, 120_000)
    const cvLines = cv.split(/\r?\n/)

    const reqWords = new Set(
      requirements
        .flatMap(r => r.split(/[^\p{L}\p{N}\-']+/u))
        .map(w => normalized(w))
        .filter(w => w.length >= 4)
    )
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
    return cv.slice(0, 1500)
  } catch {
    return (cvText || '').slice(0, 1500)
  }
}

// Main SSE POST handler
export async function POST(req: Request) {
  const timer = new PerformanceTimer()
  timer.mark('request-start')
  
  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Parse form data
        const form = await req.formData().catch(() => null)
        if (!form) {
          sendSSE(controller, 'error', { error: 'Expected multipart/form-data payload' })
          controller.close()
          return
        }

        const analysisId = String(form.get('analysisId') || '')
        if (!analysisId) {
          sendSSE(controller, 'error', { error: 'Missing analysisId' })
          controller.close()
          return
        }
        
        const title = form.get('title') ? String(form.get('title')) : undefined
        let requirements: string[] = []
        const reqRaw = form.get('requirements')
        if (typeof reqRaw === 'string') {
          try { requirements = JSON.parse(reqRaw) } catch { requirements = [] }
        }

        if (!process.env.OPENAI_API_KEY) {
          sendSSE(controller, 'error', { error: 'Missing OPENAI_API_KEY on server' })
          controller.close()
          return
        }
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        
        // Authentication
        const authHeader = req.headers.get('authorization') || ''
        const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : undefined
        if (!token) {
          sendSSE(controller, 'error', { error: 'Missing bearer token' })
          controller.close()
          return
        }
        const { data: userData, error: userErr }: any = await (supabaseAdmin as any).auth.getUser(token)
        if (userErr || !userData?.user?.id) {
          sendSSE(controller, 'error', { error: 'Unauthorized' })
          controller.close()
          return
        }
        const userId = userData.user.id as string

        // Rate limiting
        const ip = getClientIp(req)
        const userKey: BucketKey = `u:${userId}`
        const ipKey: BucketKey = `ip:${ip}`
        if (!allowRun(userKey) || !allowRun(ipKey)) {
          sendSSE(controller, 'error', { error: 'For mange analyser. Prøv igen om lidt.' })
          controller.close()
          return
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
          sendSSE(controller, 'error', { error: 'No CV files provided' })
          controller.close()
          return
        }

        // Credit check and deduction
        const cvCount = cvBlobs.length
        console.log(`💳 Checking credits for ${cvCount} CVs...`)
        
        const creditCheck = await CreditsService.hasEnoughCredits(userId, cvCount)
        
        if (!creditCheck.success) {
          console.warn('⚠️ Credit check failed, attempting to initialize balance...')
          const initResult = await CreditsService.initializeBalance(userId)
          
          if (initResult.success) {
            const retryCheck = await CreditsService.hasEnoughCredits(userId, cvCount)
            if (!retryCheck.success || (retryCheck.success && !retryCheck.data.hasCredits)) {
              sendSSE(controller, 'error', { 
                error: 'Insufficient credits',
                required: retryCheck.success ? retryCheck.data.required : cvCount,
                available: retryCheck.success ? retryCheck.data.currentBalance : 0
              })
              controller.close()
              return
            }
          } else {
            sendSSE(controller, 'error', { error: 'Failed to check credit balance' })
            controller.close()
            return
          }
        } else if (!creditCheck.data.hasCredits) {
          sendSSE(controller, 'error', { 
            error: 'Insufficient credits',
            required: creditCheck.data.required,
            available: creditCheck.data.currentBalance,
            message: `Du mangler ${creditCheck.data.shortfall} credits`
          })
          controller.close()
          return
        }
        
        console.log(`💳 Deducting ${cvCount} credits...`)
        const deductResult = await CreditsService.deductCredits(userId, analysisId, cvCount)
        
        if (!deductResult.success) {
          sendSSE(controller, 'error', { error: 'Failed to deduct credits' })
          controller.close()
          return
        }
        
        console.log(`✅ Deducted ${deductResult.data.deducted} credits. New balance: ${deductResult.data.balanceAfter}`)

        // Send initial progress event
        sendSSE(controller, 'progress', { 
          processed: 0, 
          total: cvCount, 
          currentFile: null,
          status: 'Starter analyse...'
        })

        // OpenAI system prompt
        const sys = `Du er en dansk HR-analytiker. Vurder en kandidat ift. en jobbeskrivelse og MUST-HAVE krav. Returnér KUN JSON i dette schema:
{
  "name": "str",
  "overall": 0-10, // én decimal, beregnet som gennemsnit af (krav-score/10)
  "scores": {
    "<krav1>": 0-100,
    "<krav2>": 0-100,
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

        console.log(`🚀 Starting streaming CV analysis: ${cvBlobs.length} CVs`)

        // Step 1: Extract PDF text with progress updates
        timer.mark('extraction-start')
        sendSSE(controller, 'progress', { 
          processed: 0, 
          total: cvCount, 
          currentFile: null,
          status: 'Udtrækker tekst fra CVer...'
        })

        const extractedData = await Promise.all(
          cvBlobs.map(async ({ name, blob }, index) => {
            try {
              const ab = await blob.arrayBuffer()
              const fullText = await extractPdfText(ab)
              const candidateName = extractCandidateNameFromText(fullText, decodeURIComponent(name.replace(/\.pdf$/i, '')))
              
              // 🔒 ANONYMIZE CV TEXT: Remove all personal and bias-inducing information
              // This ensures GDPR compliance and unbiased AI analysis
              const anonymizedText = anonymizeCVText(fullText, candidateName)
              console.log(`🔒 Anonymized CV for ${candidateName}: ${fullText.length} → ${anonymizedText.length} chars`)
              
              // Use anonymized text for job-relevant extraction and analysis
              const relevantExcerpt = extractJobRelevantInfo(anonymizedText, jobText, requirements)
              
              // Send progress update for extraction
              sendSSE(controller, 'extraction-progress', { 
                processed: index + 1, 
                total: cvCount,
                currentFile: name
              })
              
              return { name, candidateName, excerpt: relevantExcerpt }
            } catch (error) {
              console.warn(`PDF extraction failed for ${name}:`, error)
              return { name, candidateName: decodeURIComponent(name.replace(/\.pdf$/i, '')), excerpt: '' }
            }
          })
        )
        
        timer.mark('extraction-end')
        console.log(`🔍 PDF extraction completed in ${timer.getMarkDuration('extraction-start', 'extraction-end')}ms`)

        // Step 2: Process with OpenAI with live progress updates
        timer.mark('ai-start')
        const results: any[] = []
        const validExtractedData = extractedData.filter(data => data !== null)
        
        // Process in batches with concurrency control
        let processed = 0
        const processingPromises: Promise<void>[] = []
        
        for (let i = 0; i < validExtractedData.length; i++) {
          const { name: fileName, candidateName, excerpt } = validExtractedData[i]
          
          // Control concurrency
          if (processingPromises.length >= MAX_CONCURRENT_PROCESSING) {
            await Promise.race(processingPromises)
            processingPromises.splice(
              processingPromises.findIndex(p => Promise.resolve(p) === p),
              1
            )
          }
          
          const processingPromise = (async () => {
            try {
              // Send progress update - show which file we're analyzing
              sendSSE(controller, 'progress', { 
                processed, 
                total: cvCount, 
                currentFile: fileName,
                status: `Analyserer ${fileName}...`
              })

              // Generate cache key
              let cacheKey: string | null = null
              try {
                cacheKey = generateCacheKey(excerpt, requirements, jobText)
              } catch (hashError) {
                console.warn(`Cache key generation failed for ${fileName}`)
                cacheKey = null
              }

              // Check cache
              let result = null
              if (cacheKey) {
                try {
                  const cachedResult = await getCachedResult(cacheKey)
                  if (cachedResult && isValidCachedResult(cachedResult)) {
                    console.log(`📋 Using cached result for ${fileName}`)
                    result = { ...cachedResult, name: candidateName }
                  }
                } catch (cacheError) {
                  console.warn(`Cache lookup failed for ${fileName}`)
                }
              }

              // Process with AI if no cache hit
              if (!result) {
                console.log(`🤖 Processing ${fileName} with AI`)
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

                result = {
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
                    console.warn(`Failed to cache result for ${fileName}`)
                  }
                }
              }

              // Add cv_text_hash for resume generation
              let cvTextHash = null
              try {
                cvTextHash = createHash('sha256').update(excerpt, 'utf8').digest('hex')
              } catch (error) {
                console.warn(`Hash generation failed for ${fileName}`)
              }
              
              const finalResult = {
                ...result,
                cv_text_hash: cvTextHash
              }
              
              results.push(finalResult)
              processed++

              // Send individual result event
              sendSSE(controller, 'result', { 
                result: finalResult,
                processed,
                total: cvCount
              })

              // Cache CV text for on-demand resume generation (60 days like reports)
              if (cvTextHash && excerpt) {
                try {
                  await supabaseAdmin.from('cv_text_cache').upsert({
                    text_hash: cvTextHash,
                    cv_text: excerpt,
                    candidate_name: result.name,
                    created_at: new Date().toISOString(),
                    expires_at: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString()
                  })
                } catch (error) {
                  console.warn(`CV text caching failed for ${fileName}`)
                }
              }

            } catch (e: any) {
              console.warn('AI/parse failed for', fileName, e?.message || e)
              const fallbackResult = {
                name: candidateName,
                overall: 0,
                scores: Object.fromEntries(requirements.map((r) => [r, 0])),
                strengths: [],
                concerns: ['Analyse mislykkedes for dette CV'],
                cv_text_hash: null
              }
              results.push(fallbackResult)
              processed++
              
              sendSSE(controller, 'result', { 
                result: fallbackResult,
                processed,
                total: cvCount,
                error: `Fejl ved analyse af ${fileName}`
              })
            }
          })()
          
          processingPromises.push(processingPromise)
        }
        
        // Wait for all processing to complete
        await Promise.all(processingPromises)
        
        timer.mark('ai-end')
        console.log(`🤖 OpenAI processing completed in ${timer.getMarkDuration('ai-start', 'ai-end')}ms`)

        // Sort results by overall score
        results.sort((a, b) => b.overall - a.overall)

        timer.mark('request-end')
        timer.logSummary()

        console.log(`✅ CV analysis completed: ${results.length}/${cvBlobs.length} CVs processed`)

        // Store results in database (non-blocking)
        setImmediate(async () => {
          try {
            await supabaseAdmin.from('analysis_results').insert(
              results.map((r) => ({
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

        // Send completion event
        sendSSE(controller, 'complete', {
          ok: true,
          results,
          performance: {
            totalTime: timer.getDuration(),
            processedCount: results.length,
            totalCount: cvBlobs.length,
            extractionTime: timer.getMarkDuration('extraction-start', 'extraction-end'),
            aiProcessingTime: timer.getMarkDuration('ai-start', 'ai-end')
          }
        })

        controller.close()

      } catch (error: any) {
        console.error('❌ Stream error:', error?.message || error)
        
        // Try to send error event before closing
        try {
          sendSSE(controller, 'error', { 
            error: error?.message || 'Unknown error occurred'
          })
        } catch {}
        
        controller.close()
      }
    }
  })

  // Return SSE response with proper headers
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

