import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// =====================================================
// CRON JOB: EXPIRE EVENT ACCOUNTS
// Deaktiverer EVENT konti når de udløber (14 dage efter signup)
// Kører dagligt via Vercel Cron
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
// VERCEL CRON AUTHENTICATION
// Vercel sender en secret token i header for at verificere
// at requesten kommer fra Vercel Cron og ikke fra en bruger
// =====================================================

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  // In development, allow requests without secret
  if (process.env.NODE_ENV === 'development') {
    return true
  }
  
  // In production, verify secret
  if (!cronSecret) {
    console.error('CRON_SECRET environment variable not set!')
    return false
  }
  
  return authHeader === `Bearer ${cronSecret}`
}

// =====================================================
// GET /api/cron/expire-event-accounts
// Deaktiverer udløbne EVENT konti
// =====================================================

export async function GET(request: NextRequest) {
  
  // ==========================================
  // AUTHENTICATION
  // ==========================================
  
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  try {
    console.log('🔄 Running EVENT account expiration check...')
    
    // ==========================================
    // FIND EXPIRED EVENT ACCOUNTS
    // ==========================================
    
    // Find all EVENT accounts that:
    // 1. Are still active (is_active = true)
    // 2. Have an expiry date in the past
    const { data: expiredAccounts, error: fetchError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, company_name, contact_person, email, event_expiry_date')
      .eq('account_type', 'EVENT')
      .eq('is_active', true)
      .lt('event_expiry_date', new Date().toISOString())
    
    if (fetchError) {
      console.error('Error fetching expired accounts:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch expired accounts' },
        { status: 500 }
      )
    }
    
    if (!expiredAccounts || expiredAccounts.length === 0) {
      console.log('✅ No expired EVENT accounts found')
      return NextResponse.json({
        success: true,
        message: 'No expired accounts to process',
        expired: 0
      })
    }
    
    console.log(`⚠️  Found ${expiredAccounts.length} expired EVENT accounts`)
    
    // ==========================================
    // DEACTIVATE EACH ACCOUNT
    // ==========================================
    
    const results = {
      success: [] as string[],
      failed: [] as string[]
    }
    
    for (const account of expiredAccounts) {
      try {
        console.log(`  Deactivating: ${account.email} (${account.company_name})`)
        
        // Step 1: Deactivate profile
        const { error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', account.user_id)
        
        if (profileError) {
          console.error(`    Failed to deactivate profile: ${profileError.message}`)
          results.failed.push(account.email)
          continue
        }
        
        // Step 2: Set credits to 0
        const { error: creditsError } = await supabaseAdmin
          .from('credit_balances')
          .update({
            subscription_credits: 0,
            purchased_credits: 0,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', account.user_id)
        
        if (creditsError) {
          console.error(`    Failed to reset credits: ${creditsError.message}`)
          // Continue anyway - profile is deactivated
        }
        
        // Step 3: Log transaction
        await supabaseAdmin
          .from('credit_transactions')
          .insert({
            user_id: account.user_id,
            amount: 0,
            balance_after: 0,
            credit_type: 'purchased',
            transaction_type: 'expiration',
            description: 'EVENT account expired - credits reset to 0'
          })
        
        console.log(`    ✅ Successfully deactivated: ${account.email}`)
        results.success.push(account.email)
        
      } catch (error: any) {
        console.error(`    Error deactivating ${account.email}:`, error)
        results.failed.push(account.email)
      }
    }
    
    // ==========================================
    // SUMMARY
    // ==========================================
    
    console.log(`\n📊 Expiration Summary:`)
    console.log(`   Total found: ${expiredAccounts.length}`)
    console.log(`   Successfully deactivated: ${results.success.length}`)
    console.log(`   Failed: ${results.failed.length}`)
    
    return NextResponse.json({
      success: true,
      message: `Processed ${expiredAccounts.length} expired EVENT accounts`,
      expired: results.success.length,
      failed: results.failed.length,
      details: {
        deactivated: results.success,
        errors: results.failed
      }
    })
    
  } catch (error: any) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Cron job failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// =====================================================
// ROUTE CONFIG
// Allow route to run for up to 60 seconds (Vercel limit)
// =====================================================

export const maxDuration = 60

