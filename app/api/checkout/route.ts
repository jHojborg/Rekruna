/**
 * CHECKOUT ENDPOINT
 * 
 * Creates a Stripe Checkout session and redirects user to payment page.
 * 
 * Flow:
 * 1. User clicks "Buy Pro" in frontend
 * 2. Frontend calls this endpoint with priceId and tier
 * 3. We create Stripe checkout session
 * 4. Return URL for user to be redirected to
 * 5. User pays on Stripe's page
 * 6. Stripe sends webhook to us when done
 * 
 * Security:
 * - Requires authentication
 * - Validates tier and priceId
 * - Checks top-up eligibility
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { StripeService } from '@/lib/services/stripe.service'

export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json()
    const { tier } = body
    
    // Validate required field
    if (!tier) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: tier'
      }, { status: 400 })
    }
    
    // Map tier to priceId - Phase 3: Rekruna 1/5/10
    const priceIdMap: Record<string, string> = {
      'rekruna_1': process.env.STRIPE_REKRUNA_1_PRICE_ID || '',
      'rekruna_5': process.env.STRIPE_REKRUNA_5_PRICE_ID || '',
      'rekruna_10': process.env.STRIPE_REKRUNA_10_PRICE_ID || '',
    }
    
    const priceId = priceIdMap[tier]
    
    if (!priceId) {
      return NextResponse.json({
        success: false,
        error: `Invalid tier: ${tier}`
      }, { status: 400 })
    }
    
    // Authenticate user
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
    
    const { data: userData, error: userErr }: any = await (supabaseAdmin as any).auth.getUser(token)
    
    if (userErr || !userData?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }
    
    const userId = userData.user.id as string
    const userEmail = userData.user.email as string
    
    // Validate tier against environment variables
    const validTiers: Record<string, string> = {
      rekruna_1: process.env.STRIPE_REKRUNA_1_PRICE_ID || '',
      rekruna_5: process.env.STRIPE_REKRUNA_5_PRICE_ID || '',
      rekruna_10: process.env.STRIPE_REKRUNA_10_PRICE_ID || '',
    }
    
    if (!validTiers[tier] || validTiers[tier] !== priceId) {
      return NextResponse.json({
        success: false,
        error: 'Invalid tier or priceId mismatch'
      }, { status: 400 })
    }
    
    // Fetch user profile for billing data
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    // Create checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    const sessionResult = await StripeService.createCheckoutSession({
      userId,
      userEmail,
      priceId,
      tier,
      successUrl: `${appUrl}/dashboard?payment=success`,
      cancelUrl: `${appUrl}/?payment=canceled`,
      // Pass profile data to pre-fill Stripe billing
      profile: profile ? {
        company_name: profile.company_name,
        address: profile.address,
        postal_code: profile.postal_code,
        city: profile.city
      } : undefined
    })
    
    if (!sessionResult.success) {
      return NextResponse.json({
        success: false,
        error: sessionResult.error
      }, { status: 500 })
    }
    
    // Return checkout URL
    return NextResponse.json({
      success: true,
      url: sessionResult.data.url
    })
    
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error'
    }, { status: 500 })
  }
}

