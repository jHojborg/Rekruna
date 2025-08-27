import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { PerformanceTimer } from '@/lib/performance'
// Dynamisk import af pdf-parse for at undgå sideeffekter i bundling

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Performance optimization: concurrency control for parallel processing
const MAX_CONCURRENT_PROCESSING = 5 // Max parallel CV processing
const MAX_CONCURRENT_DOWNLOADS = 10 // Max parallel file downloads
const OPENAI_RETRY_ATTEMPTS = 3 // Retry failed OpenAI calls
const OPENAI_RETRY_DELAY = 1000 // Base delay between retries (ms)

type AnalyzeRequest = {
  analysisId: string
  requirements?: string[] // 3 valgte must-haves
  title?: string
  offset?: number // valgfrit: startindeks i sorteret fil-liste (for batching)
  limit?: number  // valgfrit: maks antal filer i dette run (default 10, max 10)
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

// Performance optimization: Parallel processing helper function
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

// Performance optimization: OpenAI retry mechanism for resilience
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

export async function POST(req: Request) {
  const timer = new PerformanceTimer()
  timer.mark('request-start')
  
  try {
    const body = (await req.json()) as AnalyzeRequest
    if (!body?.analysisId) {
      return NextResponse.json({ ok: false, error: 'Missing analysisId' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ ok: false, error: 'Missing OPENAI_API_KEY on server' }, { status: 500 })
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    // Udled userId fra bearer token
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7)
      : undefined
    if (!token) {
      return NextResponse.json({ ok: false, error: 'Missing bearer token' }, { status: 401 })
    }
    const { data: userData, error: userErr }: any = await (supabaseAdmin as any).auth.getUser(token)
    if (userErr || !userData?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    const userId = userData.user.id as string
    const analysisId = body.analysisId
    const requirements = body.requirements ?? []

    // Rate limit: per bruger og per IP (efter vi kender userId)
    const ip = getClientIp(req)
    const userKey: BucketKey = `u:${userId}`
    const ipKey: BucketKey = `ip:${ip}`
    if (!allowRun(userKey) || !allowRun(ipKey)) {
      return NextResponse.json({ ok: false, error: 'For mange analyser. Prøv igen om lidt.' }, { status: 429 })
    }

    // Hent jobbeskrivelse (valgfri men anbefalet)
    const jdBase = `${userId}/${analysisId}`
    const { data: jdList, error: jdListErr } = await supabaseAdmin.storage
      .from('job-descriptions')
      .list(jdBase, { limit: 1 })
    if (jdListErr) {
      // ikke kritisk – fortsæt uden jobText
      // eslint-disable-next-line no-console
      console.warn('job-descriptions list error:', jdListErr.message)
    }
    let jobText = ''
    if (jdList && jdList.length) {
      const { data: jdFile, error: jdDownErr } = await supabaseAdmin.storage
        .from('job-descriptions')
        .download(`${jdBase}/${jdList[0].name}`)
      if (jdDownErr) {
        console.warn('job-descriptions download error:', jdDownErr.message)
      } else if (jdFile) {
        jobText = await extractPdfText(await jdFile.arrayBuffer())
      }
    }

    // CV-liste
    const cvBase = `${userId}/${analysisId}`
    const { data: cvFiles, error: cvErr } = await supabaseAdmin.storage.from('cvs').list(cvBase, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' },
    })
    if (cvErr) throw cvErr

    // Filtypecheck – kun PDF
    let files = (cvFiles || []).filter((f) => f.name.toLowerCase().endsWith('.pdf'))
    // Batch-udsnit (offset/limit) for at kunne køre flere runs i træk uden overlap
    const offset = Math.max(0, Number.isFinite(body.offset as number) ? Number(body.offset) : 0)
    const limitReq = Math.max(1, Number.isFinite(body.limit as number) ? Number(body.limit) : 10)
    const limit = Math.min(10, limitReq) // hårdt loft 10
    files = files.slice(offset, offset + limit)

    const sys = `Du er en dansk HR-analytiker. Vurder en kandidat ift. en jobbeskrivelse og tre MUST-HAVE krav.
Returnér KUN JSON i dette schema:
{
  "name": "str",
  "overall": 0-10,              // én decimal, beregnet som gennemsnit af (krav-score/10)
  "scores": {                    // nøglerne er de tre krav nedenfor
    "<krav1>": 0-100,
    "<krav2>": 0-100,
    "<krav3>": 0-100
  },
  "strengths": ["str", ...],    // 1-3 korte punkter
  "concerns": ["str", ...]      // 0-3 korte punkter
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
${cvText || '(intet udtræk)'}
`
    }

    // PERFORMANCE OPTIMIZATION: Process CVs in parallel instead of sequentially
    // This reduces processing time from ~(n * 3-5 seconds) to ~(max(n/5) * 3-5 seconds)
    
    timer.mark('download-start')
    console.log(`🚀 Starting optimized processing of ${files.length} CVs...`)
    
    // Step 1: Download all files in parallel (faster I/O)
    const fileData = await processWithConcurrency(
      files,
      async (file) => {
        try {
          const { data: blob, error: cvDownErr } = await supabaseAdmin.storage
            .from('cvs')
            .download(`${cvBase}/${file.name}`)
          if (cvDownErr) throw cvDownErr
          return { file, blob }
        } catch (error) {
          console.warn(`Download failed for ${file.name}:`, error)
          return { file, blob: null }
        }
      },
      MAX_CONCURRENT_DOWNLOADS
    )
    timer.mark('download-end')
    console.log(`📥 Download phase completed in ${timer.getMarkDuration('download-start', 'download-end')}ms`)

    // Step 2: Extract PDF text in parallel (CPU-intensive but can be parallelized)
    timer.mark('extraction-start')
    const extractedData = await processWithConcurrency(
      fileData,
      async ({ file, blob }) => {
        if (!blob) return { file, cvText: '' }
        try {
          const cvText = await extractPdfText(await blob.arrayBuffer())
          return { file, cvText }
        } catch (error) {
          console.warn(`PDF extraction failed for ${file.name}:`, error)
          return { file, cvText: '' }
        }
      },
      MAX_CONCURRENT_PROCESSING
    )
    timer.mark('extraction-end')
    console.log(`🔍 PDF extraction completed in ${timer.getMarkDuration('extraction-start', 'extraction-end')}ms`)

    // Step 3: Process with OpenAI in parallel (network-bound, main bottleneck)
    timer.mark('ai-start')
    const results = await processWithConcurrency(
      extractedData.filter(data => data !== null), // Remove failed downloads
      async ({ file, cvText }) => {
        try {
          // Use retry mechanism for better reliability
          const resp = await callOpenAIWithRetry(
            openai,
            [
              { role: 'system', content: sys },
              { role: 'user', content: makeUserPrompt(file.name, cvText) },
            ],
            file.name
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

          // Normalisering
          const name = parsed.name || decodeURIComponent(file.name.replace(/\.pdf$/i, ''))
          const scoresObj: Record<string, number> = parsed.scores || {}
          const normalizedScores: Record<string, number> = {}
          Object.keys(scoresObj).forEach((k) => {
            const n = Number(scoresObj[k])
            normalizedScores[k] = Math.max(0, Math.min(100, Number.isFinite(n) ? Math.round(n) : 0))
          })
          const overallNum = Number(parsed.overall)
          const overall = Math.max(0, Math.min(10, Number.isFinite(overallNum) ? Number(overallNum.toFixed(1)) : 0))

          return {
            name,
            overall,
            scores: normalizedScores,
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : [],
            concerns: Array.isArray(parsed.concerns) ? parsed.concerns.slice(0, 3) : [],
          }
        } catch (e: any) {
          console.warn('AI/parse failed for', file.name, e?.message || e)
          // Fallback: minimal output, lav overall for at undgå vildledning
          return {
            name: decodeURIComponent(file.name.replace(/\.pdf$/i, '')),
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

    // Filter out null results from failed processing
    const validResults = results.filter(result => result !== null)

    // Sort by overall score (descending)
    validResults.sort((a, b) => b.overall - a.overall)

    timer.mark('request-end')
    timer.logSummary()
    console.log(`✅ Optimized processing completed: ${validResults.length}/${files.length} CVs processed successfully`)
    
    return NextResponse.json({ 
      ok: true, 
      results: validResults,
      performance: {
        totalTime: timer.getDuration(),
        processedCount: validResults.length,
        totalCount: files.length,
        downloadTime: timer.getMarkDuration('download-start', 'download-end'),
        extractionTime: timer.getMarkDuration('extraction-start', 'extraction-end'),
        aiProcessingTime: timer.getMarkDuration('ai-start', 'ai-end')
      }
    })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'Unknown error' }, { status: 500 })
  }
}



