import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// =====================================================
// PENDING EVENT SIGNUP ENDPOINT
// Gemmer signup anmodninger i pending_event_signups tabel
// Afventer admin godkendelse før bruger oprettes
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
// VALIDATION HELPERS
// =====================================================

// Tjek om email allerede eksisterer i auth.users eller pending
async function emailExists(email: string): Promise<boolean> {
  // Tjek i Supabase auth
  const { data: authUser } = await supabaseAdmin.auth.admin.getUserByEmail(email)
  if (authUser.user) return true
  
  // Tjek i pending signups
  const { data: pending } = await supabaseAdmin
    .from('pending_event_signups')
    .select('id')
    .eq('email', email)
    .single()
  
  return !!pending
}

// Valider telefonnummer: præcis 8 cifre
function isValidPhone(phone: string): boolean {
  // Fjern mellemrum og bindestreger
  const cleaned = phone.replace(/[\s-]/g, '')
  // Tjek at det er præcis 8 cifre
  return /^\d{8}$/.test(cleaned)
}

// Valider email format
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Valider password styrke
function isValidPassword(password: string): boolean {
  // Min 8 tegn, mindst 1 stort, 1 lille, 1 specialtegn
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  )
}

// =====================================================
// POST /api/event-signup/pending
// Opret pending signup anmodning
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyName, name, phone, email, password, campaignSource, utm } = body
    
    // ==========================================
    // VALIDATION
    // ==========================================
    
    // Tjek påkrævede felter
    if (!companyName || !name || !phone || !email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Alle felter er påkrævet' 
        },
        { status: 400 }
      )
    }
    
    // Trim inputs
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedPhone = phone.trim()
    const trimmedCompanyName = companyName.trim()
    const trimmedName = name.trim()
    
    // Valider email format
    if (!isValidEmail(trimmedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Ugyldig email adresse' },
        { status: 400 }
      )
    }
    
    // Valider telefonnummer (præcis 8 cifre)
    if (!isValidPhone(trimmedPhone)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Telefonnummer skal være 8 cifre (danske format)' 
        },
        { status: 400 }
      )
    }
    
    // Valider password styrke
    if (!isValidPassword(password)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Kodeord skal være min. 8 tegn med store, små bogstaver og specialtegn' 
        },
        { status: 400 }
      )
    }
    
    // Tjek om email allerede eksisterer
    const emailAlreadyExists = await emailExists(trimmedEmail)
    if (emailAlreadyExists) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Denne email er allerede registreret' 
        },
        { status: 400 }
      )
    }
    
    // ==========================================
    // HASH PASSWORD
    // ==========================================
    
    // Hash password med bcrypt (salt rounds = 10)
    const passwordHash = await bcrypt.hash(password, 10)
    
    // ==========================================
    // OPRET PENDING SIGNUP
    // ==========================================
    
    // Rens telefonnummer (kun tal)
    const cleanedPhone = trimmedPhone.replace(/[\s-]/g, '')
    
    const { data, error } = await supabaseAdmin
      .from('pending_event_signups')
      .insert({
        company_name: trimmedCompanyName,
        contact_name: trimmedName,
        phone: cleanedPhone,
        email: trimmedEmail,
        password_hash: passwordHash,
        campaign_source: campaignSource || null,
        utm_source: utm?.source || null,
        utm_medium: utm?.medium || null,
        utm_campaign: utm?.campaign || null,
        status: 'pending'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating pending signup:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Kunne ikke oprette signup anmodning. Prøv igen.' 
        },
        { status: 500 }
      )
    }
    
    // ==========================================
    // SUCCESS RESPONSE
    // ==========================================
    
    return NextResponse.json({
      success: true,
      message: 'Din anmodning er modtaget! Vi kontakter dig inden for 24 timer.',
      data: {
        id: data.id,
        email: trimmedEmail,
        created_at: data.created_at
      }
    })
    
  } catch (error) {
    console.error('Event signup error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Der opstod en fejl. Prøv igen.' 
      },
      { status: 500 }
    )
  }
}

