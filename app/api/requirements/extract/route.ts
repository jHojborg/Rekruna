import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ExtractRequest = {
  analysisId: string
}

// IMPORTANT: Do NOT instantiate OpenAI at module scope.
// Next.js may evaluate modules at build-time when collecting page data.
// If OPENAI_API_KEY is not set in the CI environment, this would throw and fail the build.
// We instead create the client inside the POST handler after validating the env var.

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
    // Handle FormData with PDF file
    const form = await req.formData()
    const jobFile = form.get('jobFile') as File
    
    if (!jobFile) {
      return NextResponse.json({ ok: false, error: 'Missing jobFile' }, { status: 400 })
    }
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ ok: false, error: 'Missing OPENAI_API_KEY on server' }, { status: 500 })
    }
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    
    // Authenticate user
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

    // Extract text from PDF file
    const arrayBuffer = await jobFile.arrayBuffer()
    const jobText = await extractPdfText(arrayBuffer)
    
    if (!jobText || jobText.trim().length < 50) {
      return NextResponse.json({ ok: false, error: 'Could not extract text from PDF or text too short' }, { status: 400 })
    }
    
    console.log('🔍 Extracting requirements from job text, length:', jobText.length)

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

    const items: string[] = Array.isArray(parsed?.requirements) ? parsed.requirements : []
    const requirements = items.slice(0, 7).map((t, i) => ({ 
      id: String(i + 1), 
      text: String(t), 
      selected: false 
    }))

    if (requirements.length === 0) {
      // Fallback til neutrale krav
      console.log('⚠️ No requirements extracted, using fallback')
      const fallback = [
        'Dokumenteret erfaring i tilsvarende rolle',
        'Stærke kommunikationsevner',
        'Struktureret og selvstændig arbejdsform',
        'Dokumenterbar erfaring med relevante værktøjer',
        'Evne til at samarbejde tværfagligt',
      ].map((t, i) => ({ id: String(i + 1), text: t, selected: false }))
      return NextResponse.json({ ok: true, requirements: fallback })
    }

    console.log('✅ Extracted', requirements.length, 'requirements:', requirements.map(r => r.text))
    return NextResponse.json({ ok: true, requirements })
  } catch (error: any) {
    console.error('Requirements extraction error:', error)
    return NextResponse.json({ ok: false, error: error?.message ?? 'Unknown error' }, { status: 500 })
  }
}


