import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { createHash } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Resume generation configuration
const OPENAI_RETRY_ATTEMPTS = 3
const OPENAI_RETRY_DELAY = 1000
const CACHE_EXPIRY_HOURS = 24

// Resume generation prompts for Danish CV summaries - simplified format without markdown
const resumeSystemPrompt = `Du laver strukturerede CV-resuméer på dansk. Følg nøjagtigt den angivne struktur og ordgrænse.

VIGTIG FORMATERING: Brug IKKE markdown (**) eller andre formateringssymboler. Skriv almindelig tekst med kun sektionsoverskrifter.

VIGTIG: Du SKAL holde arbejdserfaring (jobroller) og uddannelse (formelle uddannelser) adskilt. Bland ALDRIG disse kategorier sammen.`;

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
CV-INDHOLD: ${cvText}`;
};

// Generate resume for a candidate using OpenAI
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
    if (resumeText.length < 100) {
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

// API endpoint to fetch or generate resume for a specific candidate
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { candidateName, cvTextHash } = body;

    console.log('Resume API called with:', { candidateName, cvTextHash: cvTextHash?.substring(0, 8) + '...' });

    // Input validation
    if (!candidateName || !cvTextHash) {
      console.log('❌ Missing required fields:', { candidateName: !!candidateName, cvTextHash: !!cvTextHash });
      return NextResponse.json({ 
        ok: false, 
        error: 'Missing required fields: candidateName and cvTextHash' 
      }, { status: 400 });
    }

    // Authenticate user
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7)
      : undefined;
    if (!token) {
      return NextResponse.json({ ok: false, error: 'Missing bearer token' }, { status: 401 });
    }

    const { data: userData, error: userErr }: any = await (supabaseAdmin as any).auth.getUser(token);
    if (userErr || !userData?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Lookup CV text from temporary cache
    let cvText: string;
    try {
      console.log('🔍 Looking up CV text with hash:', cvTextHash.substring(0, 8) + '...');
      
      const { data, error } = await supabaseAdmin
        .from('cv_text_cache')
        .select('cv_text')
        .eq('text_hash', cvTextHash)
        .gte('expires_at', new Date().toISOString())
        .limit(1)
        .single();
      
      console.log('CV text lookup result:', { 
        error: error?.message, 
        hasData: !!data, 
        hasCvText: !!data?.cv_text,
        cvTextLength: data?.cv_text?.length 
      });
      
      if (error || !data?.cv_text) {
        console.log('❌ CV text not found or expired:', error?.message);
        return NextResponse.json({ 
          ok: false, 
          error: 'CV text not found or expired. Please re-run analysis.' 
        }, { status: 404 });
      }
      
      cvText = data.cv_text;
      console.log('✅ CV text found, length:', cvText.length);
    } catch (lookupError) {
      console.warn(`CV text lookup failed for ${candidateName}:`, lookupError);
      return NextResponse.json({ 
        ok: false, 
        error: 'Failed to retrieve CV text' 
      }, { status: 500 });
    }

    // Check if resume is already cached
    let resumeCacheKey: string;
    try {
      resumeCacheKey = generateResumeCacheKey(candidateName, cvText);
      const cachedResume = await getCachedResume(resumeCacheKey);
      if (cachedResume) {
        console.log(`📋 Returning cached resume for ${candidateName}`);
        return NextResponse.json({ 
          ok: true, 
          resume: cachedResume,
          fromCache: true
        });
      }
    } catch (cacheError) {
      console.warn(`Resume cache lookup failed for ${candidateName}:`, cacheError);
      return NextResponse.json({ 
        ok: false, 
        error: 'Failed to check resume cache' 
      }, { status: 500 });
    }

    // Generate new resume if not cached
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        ok: false, 
        error: 'OpenAI API key not configured' 
      }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    console.log(`🤖 Generating new resume for ${candidateName}`);
    const resume = await generateResume(openai, candidateName, cvText);
    
    if (!resume) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Failed to generate resume' 
      }, { status: 500 });
    }

    // Cache the generated resume for future use
    try {
      await setCachedResume(resumeCacheKey, resume);
    } catch (cacheStoreError) {
      console.warn(`Failed to cache resume for ${candidateName}:`, cacheStoreError);
      // Continue - caching failure shouldn't affect response
    }

    return NextResponse.json({ 
      ok: true, 
      resume,
      fromCache: false
    });

  } catch (error: any) {
    console.error('Resume API error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error?.message ?? 'Unknown error' 
    }, { status: 500 });
  }
}
