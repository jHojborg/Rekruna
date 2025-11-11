import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// =====================================================
// ADMIN: APPROVE EVENT SIGNUP ENDPOINT
// Godkender pending signup og opretter fuld bruger i systemet
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
// =====================================================

async function isAdmin(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return false
  
  // Admin email whitelist
  const adminEmails = [
    'jan@rekruna.dk',
    'support@rekruna.dk',
    'janhojborghenriksen@gmail.com', // Jan's Gmail
  ]
  
  return adminEmails.includes(user.email || '')
}

// =====================================================
// POST /api/admin/approve-event-signup
// Godkend pending signup og opret bruger
// =====================================================

export async function POST(request: NextRequest) {
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
    // PARSE REQUEST
    // ==========================================
    
    const body = await request.json()
    const { pendingId, credits = 100 } = body
    
    if (!pendingId) {
      return NextResponse.json(
        { success: false, error: 'Pending ID er påkrævet' },
        { status: 400 }
      )
    }
    
    // ==========================================
    // HENT PENDING SIGNUP
    // ==========================================
    
    const { data: pendingSignup, error: fetchError } = await supabaseAdmin
      .from('pending_event_signups')
      .select('*')
      .eq('id', pendingId)
      .eq('status', 'pending')
      .single()
    
    if (fetchError || !pendingSignup) {
      return NextResponse.json(
        { success: false, error: 'Pending signup ikke fundet' },
        { status: 404 }
      )
    }
    
    // ==========================================
    // OPRET SUPABASE AUTH USER
    // ==========================================
    
    // Note: Vi kan ikke bruge bcrypt hashed password direkte
    // Vi skal generere et midlertidigt password og sende password reset email
    
    // Generer midlertidigt sikkert password
    const tempPassword = Math.random().toString(36).slice(-12) + 'A1!' // Opfylder krav
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: pendingSignup.email,
      password: tempPassword,
      email_confirm: true, // Auto-bekræft email
      user_metadata: {
        name: pendingSignup.contact_name,
        company_name: pendingSignup.company_name
      }
    })
    
    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Kunne ikke oprette bruger: ' + authError?.message 
        },
        { status: 500 }
      )
    }
    
    const userId = authData.user.id
    
    // ==========================================
    // OPRET USER PROFILE
    // ==========================================
    
    const now = new Date()
    const expiryDate = new Date(now)
    expiryDate.setDate(expiryDate.getDate() + 14) // 14 dage fra nu
    
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: userId,
        company_name: pendingSignup.company_name,
        contact_person: pendingSignup.contact_name,
        cvr_number: '', // EVENT kunder har ikke CVR
        address: '',
        postal_code: '',
        city: '',
        email: pendingSignup.email,
        phone: pendingSignup.phone,
        marketing_consent: false,
        account_type: 'EVENT',
        event_signup_date: now.toISOString(),
        event_expiry_date: expiryDate.toISOString(),
        is_active: true
      })
    
    if (profileError) {
      console.error('Error creating user profile:', profileError)
      // Rollback: Slet auth user
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { success: false, error: 'Kunne ikke oprette profil' },
        { status: 500 }
      )
    }
    
    // ==========================================
    // OPRET CREDIT BALANCE
    // ==========================================
    
    const { error: creditError } = await supabaseAdmin
      .from('credit_balances')
      .insert({
        user_id: userId,
        subscription_credits: 0,
        purchased_credits: credits // Tildel demo credits som "purchased"
      })
    
    if (creditError) {
      console.error('Error creating credit balance:', creditError)
      // Rollback ikke nødvendig - admin kan manuelt tildele credits
    }
    
    // ==========================================
    // LOG CREDIT TRANSACTION
    // ==========================================
    
    if (!creditError) {
      await supabaseAdmin
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: credits,
          balance_after: credits,
          credit_type: 'purchased',
          transaction_type: 'admin_grant',
          description: `EVENT demo credits - Approved by admin`
        })
    }
    
    // ==========================================
    // OPDATER PENDING SIGNUP STATUS
    // ==========================================
    
    const { error: updateError } = await supabaseAdmin
      .from('pending_event_signups')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'admin' // Du kan sætte admin email her
      })
      .eq('id', pendingId)
    
    if (updateError) {
      console.error('Error updating pending signup:', updateError)
      // Ikke kritisk - brugeren er oprettet alligevel
    }
    
    // ==========================================
    // SEND PASSWORD RESET EMAIL
    // ==========================================
    
    // Send password reset email så brugeren kan sætte deres eget password
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
      pendingSignup.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`
      }
    )
    
    if (resetError) {
      console.error('Error sending password reset email:', resetError)
      // Ikke kritisk - admin kan manuelt sende reset link
    }
    
    // ==========================================
    // SUCCESS RESPONSE
    // ==========================================
    
    return NextResponse.json({
      success: true,
      message: `Bruger ${pendingSignup.email} er godkendt og oprettet med ${credits} credits`,
      data: {
        userId,
        email: pendingSignup.email,
        companyName: pendingSignup.company_name,
        credits,
        expiryDate: expiryDate.toISOString(),
        passwordResetSent: !resetError
      }
    })
    
  } catch (error) {
    console.error('Approve event signup error:', error)
    return NextResponse.json(
      { success: false, error: 'Der opstod en fejl' },
      { status: 500 }
    )
  }
}

// =====================================================
// DELETE /api/admin/approve-event-signup
// Afvis pending signup (slet eller marker som rejected)
// =====================================================

export async function DELETE(request: NextRequest) {
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
    // PARSE REQUEST
    // ==========================================
    
    const { searchParams } = new URL(request.url)
    const pendingId = searchParams.get('id')
    
    if (!pendingId) {
      return NextResponse.json(
        { success: false, error: 'Pending ID er påkrævet' },
        { status: 400 }
      )
    }
    
    // ==========================================
    // MARKER SOM REJECTED
    // ==========================================
    
    const { error } = await supabaseAdmin
      .from('pending_event_signups')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'admin'
      })
      .eq('id', pendingId)
    
    if (error) {
      console.error('Error rejecting signup:', error)
      return NextResponse.json(
        { success: false, error: 'Kunne ikke afvise signup' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Signup afvist'
    })
    
  } catch (error) {
    console.error('Reject signup error:', error)
    return NextResponse.json(
      { success: false, error: 'Der opstod en fejl' },
      { status: 500 }
    )
  }
}

