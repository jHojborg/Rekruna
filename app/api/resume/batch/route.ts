import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { createHash } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for batch processing

// Configuration
const OPENAI_RETRY_ATTEMPTS = 3
const OPENAI_RETRY_DELAY = 1000
const CACHE_EXPIRY_HOURS = 24
const MAX_CONCURRENT_GENERATIONS = 5 // Process 5 resumes at a time

// Resume generation prompts - simplified format without markdown
const resumeSystemPrompt = `Du laver strukturerede CV-resuméer på dansk. Følg nøjagtigt den angivne struktur og ordgrænse.

VIGTIG FORMATERING: Brug IKKE markdown (**) eller andre formateringssymboler. Skriv almindelig tekst med kun sektionsoverskrifter.

VIGTIG: Du SKAL holde arbejdserfaring (jobroller) og uddannelse (formelle uddannelser) adskilt. Bland ALDRIG disse kategorier sammen.`

const makeResumePrompt = (fileName: string, cvText: string) => {
  return `Lav et struktureret dansk resumé af denne kandidat på præcis 200 ord:

STRUKTUR (brug ingen markdown eller ** symboler):
Profil:
[2-3 linjer - nuværende rolle og samlet erfaring]

Nøgleerfaring:
- [Mest relevant ARBEJDSSTILLING med årstal og virksomhed]
- [Næstmest relevant ARBEJDSSTILLING med årstal og virksomhed]
- [Tredje relevant ARBEJDSSTILLING med årstal og virksomhed]
[KUN joberfaring, IKKE uddannelse]

Kernekompetencer:
- [Kompetence 1]
- [Kompetence 2]
- [Kompetence 3]
[Job-relevante færdigheder og teknologier]

Uddannelse:
- [Grad/titel - Institution (årstal)]
[KUN formelle uddannelser, degrees, kurser og certificeringer - IKKE job-erfaring]

Konkrete resultater:
- [Målbart achievement 1]
- [Målbart achievement 2]
- [Målbart achievement 3]
[Målbare achievements der understøtter kravene]

VIGTIGE REGLER FOR KATEGORISERING:
- Nøgleerfaring: Kun tidligere arbejdspladser, job-titler, ansættelsesperioder og virksomheder
- Uddannelse: Kun formelle uddannelser, universiteter, højskoler, kurser, certificeringer
- Bland ALDRIG arbejdserfaring og uddannelse sammen
- Brug INGEN markdown symboler (**, *, _, etc.) - kun almindelig tekst
- Sektionsoverskrifter skal stå alene på en linje efterfulgt af kolon

FOKUS:
- Fremhæv erfaring der matcher stillingsopslaget
- Inkludér kun job-relevante information
- Brug konkrete tal og resultater hvor muligt
- Præcis 200 ord - ikke mere, ikke mindre
- Hold arbejdserfaring og uddannelse adskilt

UDELAD:
- Personlige oplysninger (alder, adresse, familie)
- Irrelevante hobbyer
- Vage beskrivelser uden konkret indhold

KANDIDAT: ${fileName}
CV-INDHOLD: ${cvText}`
}

// Generate resume using OpenAI
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
      max_tokens: 400,
    })

    const resumeText = resp.choices?.[0]?.message?.content?.trim() || ''
    
    // Basic validation
    if (resumeText.length < 100) {
      throw new Error('Generated resume too short')
    }

    return resumeText
  } catch (error: any) {
    if (attempt >= OPENAI_RETRY_ATTEMPTS) {
      console.warn(`Resume generation failed for ${fileName} after ${attempt} attempts:`, error?.message)
      return null
    }
    
    const delayMs = OPENAI_RETRY_DELAY * Math.pow(2, attempt - 1)
    console.warn(`Resume generation retry for ${fileName} (attempt ${attempt}), waiting ${delayMs}ms...`)
    await new Promise(resolve => setTimeout(resolve, delayMs))
    
    return generateResume(openai, fileName, cvText, attempt + 1)
  }
}

// Cache key generation
function generateResumeCacheKey(candidateName: string, cvText: string): string {
  const normalizedName = (candidateName || '').trim().toLowerCase()
  const normalizedText = (cvText || '').replace(/\s+/g, ' ').trim().toLowerCase()
  const hashInput = `resume:${normalizedName}|${normalizedText}`
  return createHash('sha256').update(hashInput, 'utf8').digest('hex')
}

// Check if resume is already cached
async function getCachedResume(cacheKey: string): Promise<string | null> {
  try {
    const cutoffTime = new Date(Date.now() - (CACHE_EXPIRY_HOURS * 60 * 60 * 1000)).toISOString()
    
    const { data, error } = await supabaseAdmin
      .from('resume_cache')
      .select('resume_text, created_at')
      .eq('cache_key', cacheKey)
      .gte('created_at', cutoffTime)
      .limit(1)
      .single()
    
    if (error || !data?.resume_text) {
      return null
    }
    
    return data.resume_text
  } catch (error: any) {
    console.warn('Resume cache lookup failed:', error?.message)
    return null
  }
}

// Store resume in cache
async function setCachedResume(cacheKey: string, resumeText: string): Promise<void> {
  try {
    if (!resumeText || resumeText.length < 50) {
      console.warn('Attempted to cache invalid resume, skipping')
      return
    }
    
    const { error } = await supabaseAdmin
      .from('resume_cache')
      .upsert({
        cache_key: cacheKey,
        resume_text: resumeText,
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.warn('Resume cache storage failed:', error?.message)
    }
  } catch (error: any) {
    console.warn('Resume cache storage error:', error?.message)
  }
}

// Process multiple resumes with concurrency control
async function processBatchWithConcurrency<T>(
  items: T[],
  processor: (item: T) => Promise<void>,
  maxConcurrency: number
): Promise<void> {
  const results: Promise<void>[] = []
  
  for (let i = 0; i < items.length; i += maxConcurrency) {
    const batch = items.slice(i, i + maxConcurrency)
    const batchPromises = batch.map(item => processor(item))
    results.push(...batchPromises)
    await Promise.all(batchPromises)
  }
  
  await Promise.all(results)
}

// Main batch endpoint
export async function POST(req: Request) {
  try {
    // Security: Check for internal API key
    const internalKey = req.headers.get('x-internal-key')
    if (internalKey !== process.env.INTERNAL_API_KEY) {
      console.warn('⚠️ Batch resume endpoint called without valid internal key')
      return NextResponse.json({ 
        ok: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const body = await req.json()
    const { jobs } = body

    console.log(`📦 Batch resume generation started for ${jobs?.length || 0} candidates`)

    // Validate input
    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid jobs array' 
      }, { status: 400 })
    }

    // Initialize OpenAI
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured')
      return NextResponse.json({ 
        ok: false, 
        error: 'OpenAI not configured' 
      }, { status: 500 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    let processed = 0
    let cached = 0
    let generated = 0
    let failed = 0

    // Process each job with concurrency control
    await processBatchWithConcurrency(
      jobs,
      async (job: { candidateName: string; cvTextHash: string }) => {
        try {
          const { candidateName, cvTextHash } = job

          // Look up CV text from cache
          const { data: cvData, error: cvError } = await supabaseAdmin
            .from('cv_text_cache')
            .select('cv_text')
            .eq('text_hash', cvTextHash)
            .gte('expires_at', new Date().toISOString())
            .limit(1)
            .single()

          if (cvError || !cvData?.cv_text) {
            console.warn(`❌ CV text not found for ${candidateName}`)
            failed++
            return
          }

          const cvText = cvData.cv_text

          // Check if resume is already cached
          const resumeCacheKey = generateResumeCacheKey(candidateName, cvText)
          const cachedResume = await getCachedResume(resumeCacheKey)

          if (cachedResume) {
            console.log(`✅ Resume already cached for ${candidateName}`)
            cached++
            processed++
            return
          }

          // Generate new resume
          console.log(`🤖 Generating resume for ${candidateName}...`)
          const resume = await generateResume(openai, candidateName, cvText)

          if (!resume) {
            console.warn(`❌ Failed to generate resume for ${candidateName}`)
            failed++
            processed++
            return
          }

          // Cache the generated resume
          await setCachedResume(resumeCacheKey, resume)
          console.log(`💾 Resume generated and cached for ${candidateName}`)
          generated++
          processed++

        } catch (error: any) {
          console.error(`❌ Error processing resume for candidate:`, error?.message)
          failed++
        }
      },
      MAX_CONCURRENT_GENERATIONS
    )

    console.log(`✅ Batch resume generation completed: ${processed} total, ${cached} cached, ${generated} generated, ${failed} failed`)

    return NextResponse.json({ 
      ok: true,
      stats: {
        total: jobs.length,
        processed,
        cached,
        generated,
        failed
      }
    })

  } catch (error: any) {
    console.error('❌ Batch resume API error:', error)
    return NextResponse.json({ 
      ok: false, 
      error: error?.message ?? 'Unknown error' 
    }, { status: 500 })
  }
}

