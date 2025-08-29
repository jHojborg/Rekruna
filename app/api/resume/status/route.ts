import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/server'

// Simple API to check if resumes are cached for given CV hashes
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { cvTextHashes } = body

    if (!Array.isArray(cvTextHashes)) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Expected array of cvTextHashes' 
      }, { status: 400 })
    }

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

    // Check resume cache for each hash
    const statusMap: Record<string, boolean> = {}
    
    for (const cvTextHash of cvTextHashes) {
      if (!cvTextHash) {
        statusMap[cvTextHash] = false
        continue
      }

      try {
        // Look up CV text to create cache key
        const { data: cvData } = await supabaseAdmin
          .from('cv_text_cache')
          .select('cv_text, candidate_name')
          .eq('text_hash', cvTextHash)
          .gte('expires_at', new Date().toISOString())
          .limit(1)
          .single()

        if (cvData?.cv_text && cvData?.candidate_name) {
          // Generate cache key same way as in analyze route
          const cacheKey = createHash('sha256')
            .update(`resume:${cvData.candidate_name}:${cvData.cv_text.substring(0, 200)}`, 'utf8')
            .digest('hex')

          // Check if resume exists in cache
          const { data: resumeData } = await supabaseAdmin
            .from('resume_cache')
            .select('cache_key')
            .eq('cache_key', cacheKey)
            .limit(1)
            .single()

          statusMap[cvTextHash] = !!resumeData
        } else {
          statusMap[cvTextHash] = false
        }
      } catch (error) {
        statusMap[cvTextHash] = false
      }
    }

    return NextResponse.json({
      ok: true,
      resumeStatus: statusMap
    })

  } catch (error: any) {
    return NextResponse.json({ 
      ok: false, 
      error: error?.message ?? 'Unknown error' 
    }, { status: 500 })
  }
}
