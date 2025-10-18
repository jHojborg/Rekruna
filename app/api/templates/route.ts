/**
 * Job Templates API
 * 
 * Endpoints for managing reusable job templates
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// GET: List all templates for user
export async function GET(req: NextRequest) {
  try {
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

    // Fetch user's templates
    const { data: templates, error } = await supabaseAdmin
      .from('job_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json({ ok: false, error: 'Failed to fetch templates' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, templates })

  } catch (error: any) {
    console.error('GET /api/templates error:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

// POST: Create new template
export async function POST(req: NextRequest) {
  try {
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

    // Parse request body
    const body = await req.json()
    const { title, description, jobFileName, requirements } = body

    // Validation
    if (!title || !requirements || !Array.isArray(requirements)) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Missing required fields: title and requirements' 
      }, { status: 400 })
    }

    if (requirements.length < 2 || requirements.length > 5) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Requirements must be between 2 and 5' 
      }, { status: 400 })
    }

    // Create template
    const { data: template, error } = await supabaseAdmin
      .from('job_templates')
      .insert({
        user_id: user.id,
        title,
        description: description || null,
        job_file_name: jobFileName || null,
        requirements: requirements,
        usage_count: 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating template:', error)
      return NextResponse.json({ 
        ok: false, 
        error: error.message || 'Failed to create template',
        details: error
      }, { status: 500 })
    }

    console.log('✅ Template created:', template.id)
    return NextResponse.json({ ok: true, template })

  } catch (error: any) {
    console.error('POST /api/templates error:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

// DELETE: Delete template
export async function DELETE(req: NextRequest) {
  try {
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

    // Get template ID from query params
    const { searchParams } = new URL(req.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json({ ok: false, error: 'Missing template ID' }, { status: 400 })
    }

    // Delete template (RLS will ensure user owns it)
    const { error } = await supabaseAdmin
      .from('job_templates')
      .delete()
      .eq('id', templateId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting template:', error)
      return NextResponse.json({ ok: false, error: 'Failed to delete template' }, { status: 500 })
    }

    console.log('✅ Template deleted:', templateId)
    return NextResponse.json({ ok: true })

  } catch (error: any) {
    console.error('DELETE /api/templates error:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

