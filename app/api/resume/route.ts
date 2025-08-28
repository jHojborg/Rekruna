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

// Resume generation prompts for Danish CV summaries
const resumeSystemPrompt = `Du laver strukturerede CV-resuméer på dansk. Følg nøjagtigt den angivne struktur og ordgrænse.`;

const makeResumePrompt = (fileName: string, cvText: string) => {
  return `Lav et struktureret dansk resumé af denne kandidat på præcis 200 ord:

STRUKTUR:
**Profil:** [2-3 linjer - nuværende rolle og samlet erfaring]
**Nøgleerfaring:** [3-4 mest relevante tidligere stillinger med år og virksomhed]
**Kernekompetencer:** [job-relevante færdigheder og teknologier]
**Uddannelse:** [relevante uddannelser og certificeringer]
**Konkrete resultater:** [målbare achievements der understøtter kravene]

FOKUS:
- Fremhæv erfaring der matcher stillingsopslaget
- Inkludér kun job-relevante information
- Brug konkrete tal og resultater hvor muligt
- Præcis 200 ord - ikke mere, ikke mindre

UDELAD:
- Personlige oplysninger (alder, adresse, familie)
- Irrelevante hobbyer eller kurser
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

// API endpoint to fetch or generate resume for a specific candidate
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { candidateName, cvTextHash } = body;

    // Input validation
    if (!candidateName || !cvTextHash) {
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
      const { data, error } = await supabaseAdmin
        .from('cv_text_cache')
        .select('cv_text')
        .eq('text_hash', cvTextHash)
        .gte('expires_at', new Date().toISOString())
        .limit(1)
        .single();
      
      if (error || !data?.cv_text) {
        return NextResponse.json({ 
          ok: false, 
          error: 'CV text not found or expired. Please re-run analysis.' 
        }, { status: 404 });
      }
      
      cvText = data.cv_text;
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
