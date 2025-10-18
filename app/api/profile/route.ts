/**
 * PROFILE API ENDPOINT
 * 
 * Handles user profile creation and updates
 * Stores business information for invoicing and marketing
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * GET - Fetch user profile
 */
export async function GET(req: Request) {
  try {
    // Get auth token from header
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.toLowerCase().startsWith('bearer ') 
      ? authHeader.slice(7) 
      : undefined
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Missing authentication token'
      }, { status: 401 })
    }
    
    // Verify user
    const { data: userData, error: userErr }: any = await (supabaseAdmin as any).auth.getUser(token)
    
    if (userErr || !userData?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }
    
    const userId = userData.user.id
    
    // Fetch profile
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (profileErr) {
      // Profile doesn't exist yet
      if (profileErr.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          data: null
        })
      }
      
      return NextResponse.json({
        success: false,
        error: profileErr.message
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: profile
    })
    
  } catch (error: any) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * POST - Create or update user profile
 */
export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json()
    const {
      company_name,
      contact_person,
      cvr_number,
      address,
      postal_code,
      city,
      email,
      phone,
      marketing_consent
    } = body
    
    // Validate required fields
    if (!company_name || !contact_person || !cvr_number || !address || !postal_code || !city || !email) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }
    
    // Get auth token from header
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.toLowerCase().startsWith('bearer ') 
      ? authHeader.slice(7) 
      : undefined
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Missing authentication token'
      }, { status: 401 })
    }
    
    // Verify user
    const { data: userData, error: userErr }: any = await (supabaseAdmin as any).auth.getUser(token)
    
    if (userErr || !userData?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }
    
    const userId = userData.user.id
    
    // Upsert profile (create or update)
    const { data: profile, error: upsertErr } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        user_id: userId,
        company_name,
        contact_person,
        cvr_number,
        address,
        postal_code,
        city,
        email,
        phone: phone || null,
        marketing_consent: marketing_consent || false,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()
    
    if (upsertErr) {
      console.error('Profile upsert error:', upsertErr)
      return NextResponse.json({
        success: false,
        error: upsertErr.message
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: profile
    })
    
  } catch (error: any) {
    console.error('Profile save error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error'
    }, { status: 500 })
  }
}



