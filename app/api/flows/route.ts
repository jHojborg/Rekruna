/**
 * GET /api/flows?analysisId=xxx
 * Phase 4: Hent flow-info for 14-dages advarsel
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getFlowInfo } from '@/lib/services/recruitment-flow.service'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const analysisId = searchParams.get('analysisId')
    if (!analysisId) {
      return NextResponse.json({ ok: false, error: 'Missing analysisId' }, { status: 400 })
    }

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : undefined
    if (!token) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData, error: userErr }: any = await (supabaseAdmin as any).auth.getUser(token)
    if (userErr || !userData?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    const userId = userData.user.id as string

    const flow = await getFlowInfo(userId, analysisId)
    return NextResponse.json({ ok: true, flow })
  } catch (e: any) {
    console.error('GET /api/flows error:', e)
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 500 })
  }
}
