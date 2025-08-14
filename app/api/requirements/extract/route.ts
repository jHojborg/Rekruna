import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ExtractRequest = {
  userId: string
  analysisId: string
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

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
    console.warn('PDF text extraction (extract/pdf2json) failed:', e?.message || e)
    return ''
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ExtractRequest
    if (!body?.userId || !body?.analysisId) {
      return NextResponse.json({ ok: false, error: 'Missing userId or analysisId' }, { status: 400 })
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ ok: false, error: 'Missing OPENAI_API_KEY on server' }, { status: 500 })
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const { userId, analysisId } = body

    // Find job description file
    const base = `${userId}/${analysisId}`
    const { data: list, error: listErr } = await supabaseAdmin.storage
      .from('job-descriptions')
      .list(base, { limit: 1, sortBy: { column: 'name', order: 'asc' } })
    if (listErr) throw listErr
    if (!list || list.length === 0) {
      return NextResponse.json({ ok: false, error: 'Jobbeskrivelse ikke fundet' }, { status: 404 })
    }

    const first = list[0]
    const { data: file, error: downErr } = await supabaseAdmin.storage
      .from('job-descriptions')
      .download(`${base}/${first.name}`)
    if (downErr || !file) throw downErr || new Error('Download failed')

    const jobText = await extractPdfText(await file.arrayBuffer())

    const sys = `Du er en dansk HR-analytiker. Udtræk de 5-7 mest kritiske "must-have" krav fra en jobbeskrivelse.
Returnér KUN JSON på denne form:
{
  "requirements": ["kort krav 1", "kort krav 2", ...]
}
Regler: 3-8 ord pr. punkt, ingen overlap/dubletter, ingen "nice-to-have". Dansk sprog.`

    const user = `JOBBESKRIVELSE:\n\n${jobText}`

    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
    })

    const raw = resp.choices?.[0]?.message?.content || ''
    let parsed: any | null = null
    try { parsed = JSON.parse(raw) } catch {
      const m = raw.match(/\{[\s\S]*\}/)
      if (m) { try { parsed = JSON.parse(m[0]) } catch {} }
    }

    const items: string[] = Array.isArray(parsed?.requirements) ? parsed.requirements : []
    const requirements = items.slice(0, 7).map((t, i) => ({ id: String(i + 1), text: String(t), selected: false }))

    if (requirements.length === 0) {
      // Fallback til neutrale krav
      const fallback = [
        'Dokumenteret erfaring i tilsvarende rolle',
        'Stærke kommunikationsevner',
        'Struktureret og selvstændig arbejdsform',
        'Dokumenterbar erfaring med relevante værktøjer',
        'Evne til at samarbejde tværfagligt',
      ].map((t, i) => ({ id: String(i + 1), text: t, selected: false }))
      return NextResponse.json({ ok: true, requirements: fallback })
    }

    return NextResponse.json({ ok: true, requirements })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'Unknown error' }, { status: 500 })
  }
}


