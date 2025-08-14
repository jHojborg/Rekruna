import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import OpenAI from 'openai'
// Dynamisk import af pdf-parse for at undgå sideeffekter i bundling

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type AnalyzeRequest = {
  userId: string
  analysisId: string
  requirements?: string[] // 3 valgte must-haves
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
  try {
    const body = (await req.json()) as AnalyzeRequest
    if (!body?.userId || !body?.analysisId) {
      return NextResponse.json({ ok: false, error: 'Missing userId or analysisId' }, { status: 400 })
    }

    // Rate limit: per bruger og per IP
    const ip = getClientIp(req)
    const userKey: BucketKey = `u:${body.userId}`
    const ipKey: BucketKey = `ip:${ip}`
    if (!allowRun(userKey) || !allowRun(ipKey)) {
      return NextResponse.json({ ok: false, error: 'For mange analyser. Prøv igen om lidt.' }, { status: 429 })
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ ok: false, error: 'Missing OPENAI_API_KEY on server' }, { status: 500 })
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const { userId, analysisId, requirements = [] } = body

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

    let files = (cvFiles || []).filter((f) => f.name.toLowerCase().endsWith('.pdf'))
    // Maks 10 CV'er per run
    if (files.length > 10) files = files.slice(0, 10)

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

    const results: any[] = []
    for (const f of files) {
      const { data: blob, error: cvDownErr } = await supabaseAdmin.storage.from('cvs').download(`${cvBase}/${f.name}`)
      if (cvDownErr) throw cvDownErr
      const cvText = blob ? await extractPdfText(await blob.arrayBuffer()) : ''

      try {
        const resp = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0.2,
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: makeUserPrompt(f.name, cvText) },
          ],
          response_format: { type: 'json_object' },
        })
        const raw = resp.choices?.[0]?.message?.content || ''
        let parsed: any | null = null
        try { parsed = JSON.parse(raw) } catch {
          const m = raw.match(/\{[\s\S]*\}/)
          if (m) { try { parsed = JSON.parse(m[0]) } catch {} }
        }
        if (!parsed) throw new Error('Invalid AI response')

        // Normalisering
        const name = parsed.name || decodeURIComponent(f.name.replace(/\.pdf$/i, ''))
        const scoresObj: Record<string, number> = parsed.scores || {}
        const normalizedScores: Record<string, number> = {}
        Object.keys(scoresObj).forEach((k) => {
          const n = Number(scoresObj[k])
          normalizedScores[k] = Math.max(0, Math.min(100, Number.isFinite(n) ? Math.round(n) : 0))
        })
        const overallNum = Number(parsed.overall)
        const overall = Math.max(0, Math.min(10, Number.isFinite(overallNum) ? Number(overallNum.toFixed(1)) : 0))

        results.push({
          name,
          overall,
          scores: normalizedScores,
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : [],
          concerns: Array.isArray(parsed.concerns) ? parsed.concerns.slice(0, 3) : [],
        })
      } catch (e: any) {
        console.warn('AI/parse failed for', f.name, e?.message || e)
        // Fallback: minimal output, lav overall for at undgå vildledning
        results.push({
          name: decodeURIComponent(f.name.replace(/\.pdf$/i, '')),
          overall: 0,
          scores: Object.fromEntries(requirements.map((r) => [r, 0])),
          strengths: [],
          concerns: ['Analyse mislykkedes for dette CV'],
        })
      }
    }

    results.sort((a, b) => b.overall - a.overall)

    return NextResponse.json({ ok: true, results })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'Unknown error' }, { status: 500 })
  }
}



