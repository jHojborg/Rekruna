import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { PerformanceTimer } from '@/lib/performance'
// Dynamisk import af pdf-parse for at undgå sideeffekter i bundling

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Performance: concurrency control for parallel processing (in-memory only)
const MAX_CONCURRENT_PROCESSING = 5 // Max parallel CV processing
const OPENAI_RETRY_ATTEMPTS = 3 // Retry failed OpenAI calls
const OPENAI_RETRY_DELAY = 1000 // Base delay between retries (ms)

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
    // Vi gemmer ikke CV-filer i permanent storage længere.
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
    } else if (Array.isArray(reqRaw)) {
      // Ikke normalt for FormData, men vi beskytter os alligevel
      requirements = reqRaw.map(String)
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

    // Rate limit: per bruger og per IP (efter vi kender userId)
    const ip = getClientIp(req)
    const userKey: BucketKey = `u:${userId}`
    const ipKey: BucketKey = `ip:${ip}`
    if (!allowRun(userKey) || !allowRun(ipKey)) {
      return NextResponse.json({ ok: false, error: 'For mange analyser. Prøv igen om lidt.' }, { status: 429 })
    }

    // Hent jobbeskrivelse direkte fra FormData (enten PDF eller for-udtrukket tekst)
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

    // CV-filer fra FormData
    // NB: FormData returnerer den første værdi for en given nøgle; vi henter alle ved at gennemløbe entries
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

    // PERFORMANCE: Process CVs in parallel in-memory
    console.log(`🚀 Starting in-memory processing of ${cvBlobs.length} CVs...`)

    // Step 1: Extract PDF text in parallel (CPU-intensive but can be parallelized)
    timer.mark('extraction-start')
    const extractedData = await processWithConcurrency(
      cvBlobs,
      async ({ name, blob }) => {
        try {
          const ab = await blob.arrayBuffer()
          const fullText = await extractPdfText(ab)
          // GDPR: reducer input til AI – kun jobrelevant uddrag + navn
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

    // Step 2: Process with OpenAI in parallel (network-bound, main bottleneck)
    timer.mark('ai-start')
    const results = await processWithConcurrency(
      extractedData.filter(data => data !== null),
      async ({ name: fileName, candidateName, excerpt }) => {
        try {
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

          // Normalisering
          const name = parsed.name || candidateName
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
          console.warn('AI/parse failed for', fileName, e?.message || e)
          // Fallback: minimal output, lav overall for at undgå vildledning
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

    // Filter out null results from failed processing
    const validResults = results.filter(result => result !== null)

    // Sort by overall score (descending)
    validResults.sort((a, b) => b.overall - a.overall)

    timer.mark('request-end')
    timer.logSummary()
    console.log(`✅ In-memory processing completed: ${validResults.length}/${cvBlobs.length} CVs processed successfully`)

    // Valgfri DB-lagring (kun struktureret data, ingen filreferencer)
    try {
      await supabaseAdmin.from('analysis_results').insert(
        validResults.map((r) => ({
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
      // Ikke-kritisk – vi fortsætter uden at fejle requesten
      console.warn('DB insert skipped/failed:', (e as any)?.message)
    }
    
    // Proaktiv oprydning (frigiv store arrays)
    ;(global as any)._void = null
    
    return NextResponse.json({ 
      ok: true, 
      results: validResults,
      performance: {
        totalTime: timer.getDuration(),
        processedCount: validResults.length,
        totalCount: cvBlobs.length,
        extractionTime: timer.getMarkDuration('extraction-start', 'extraction-end'),
        aiProcessingTime: timer.getMarkDuration('ai-start', 'ai-end')
      }
    })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'Unknown error' }, { status: 500 })
  }
}



