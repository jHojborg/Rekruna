/**
 * Track template usage
 * Updates last_used_at and increments usage_count
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js 15, params is now async
    const { id: templateId } = await params

    // Get user from auth header
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
    }

    // Verify token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 })
    }

    // First, get current usage count
    const { data: template } = await supabaseAdmin
      .from('job_templates')
      .select('usage_count')
      .eq('id', templateId)
      .eq('user_id', user.id)
      .single()

    // Update usage stats
    const { error } = await supabaseAdmin
      .from('job_templates')
      .update({
        last_used_at: new Date().toISOString(),
        usage_count: (template?.usage_count || 0) + 1
      })
      .eq('id', templateId)
      .eq('user_id', user.id)

    if (error) {
      // Non-critical error, just log it
      console.warn('Failed to update template usage:', error)
    }

    return NextResponse.json({ ok: true })

  } catch (error: any) {
    console.error('POST /api/templates/[id]/use error:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

