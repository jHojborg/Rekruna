import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminRequest } from '@/lib/auth/admin'

// =====================================================
// ADMIN: PENDING SIGNUPS ENDPOINT
// Henter liste over pending EVENT signup anmodninger
// =====================================================

// Supabase service role client (kan bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// =====================================================
// HELPER: Check om bruger er admin
// SECURITY FIX: Now uses centralized admin auth (no hardcoded emails)
// =====================================================

async function isAdmin(request: NextRequest): Promise<boolean> {
  // Hent auth token fra header
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  
  // Use centralized admin check (reads from ADMIN_EMAILS env variable)
  return await isAdminRequest(authHeader)
}

// =====================================================
// GET /api/admin/pending-signups
// Hent alle pending signups (kun for admins)
// =====================================================

export async function GET(request: NextRequest) {
  try {
    // ==========================================
    // AUTH CHECK
    // ==========================================
    
    const isUserAdmin = await isAdmin(request)
    if (!isUserAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }
    
    // ==========================================
    // QUERY PARAMETERS
    // ==========================================
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const campaignSource = searchParams.get('campaign')
    
    // ==========================================
    // HENT PENDING SIGNUPS
    // ==========================================
    
    let query = supabaseAdmin
      .from('pending_event_signups')
      .select('*', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // Filter på campaign hvis specificeret
    if (campaignSource) {
      query = query.eq('campaign_source', campaignSource)
    }
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('Error fetching pending signups:', error)
      return NextResponse.json(
        { success: false, error: 'Kunne ikke hente signups' },
        { status: 500 }
      )
    }
    
    // ==========================================
    // STATISTICS
    // ==========================================
    
    // Hent counts for hver status
    const { data: stats } = await supabaseAdmin
      .from('pending_event_signups')
      .select('status', { count: 'exact', head: false })
    
    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0
    }
    
    if (stats) {
      stats.forEach((row: any) => {
        if (row.status in statusCounts) {
          statusCounts[row.status as keyof typeof statusCounts]++
        }
      })
    }
    
    // ==========================================
    // SUCCESS RESPONSE
    // ==========================================
    
    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      },
      statistics: statusCounts
    })
    
  } catch (error) {
    console.error('Admin pending signups error:', error)
    return NextResponse.json(
      { success: false, error: 'Der opstod en fejl' },
      { status: 500 }
    )
  }
}

