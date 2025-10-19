/**
 * STRIPE WEBHOOK ENDPOINT
 * 
 * Receives events from Stripe when payments happen.
 * 
 * CRITICAL: This is how we know when to add credits!
 * When user pays → Stripe calls this endpoint → We add credits
 * 
 * Events we handle:
 * - checkout.session.completed: Payment succeeded (one-time or first subscription payment)
 * - invoice.paid: Monthly subscription renewal
 * - customer.subscription.updated: Subscription status changed
 * - customer.subscription.deleted: Subscription canceled
 * 
 * Security:
 * - MUST verify webhook signature (proves it came from Stripe)
 * - Use raw body for signature verification
 */

import { NextResponse } from 'next/server'
import { StripeService } from '@/lib/services/stripe.service'
import { supabaseAdmin } from '@/lib/supabase/server'
import Stripe from 'stripe'

// IMPORTANT: We need the raw body for webhook signature verification
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    // Get the raw body (needed for signature verification)
    const body = await req.text()
    
    // Get Stripe signature from headers
    const signature = req.headers.get('stripe-signature')
    
    if (!signature) {
      console.error('❌ Missing Stripe signature')
      return NextResponse.json({
        success: false,
        error: 'Missing stripe-signature header'
      }, { status: 400 })
    }
    
    // Verify webhook signature (CRITICAL FOR SECURITY!)
    const eventResult = StripeService.constructWebhookEvent(body, signature)
    
    if (!eventResult.success) {
      console.error('❌ Webhook signature verification failed:', eventResult.error)
      return NextResponse.json({
        success: false,
        error: 'Invalid signature'
      }, { status: 400 })
    }
    
    const event = eventResult.data
    
    console.log(`📨 Stripe webhook received: ${event.type}`)
    
    // Handle different event types
    switch (event.type) {
      
      // =====================================================
      // Payment succeeded (one-time purchase or first subscription payment)
      // =====================================================
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        console.log('💳 Processing checkout.session.completed...')
        console.log(`   Session ID: ${session.id}`)
        console.log(`   Customer: ${session.customer}`)
        console.log(`   Mode: ${session.mode}`)
        
        const result = await StripeService.handleCheckoutCompleted(session)
        
        if (!result.success) {
          console.error('❌ Failed to handle checkout:', result.error)
          // Don't return error to Stripe (we'll retry manually if needed)
          // Return 200 so Stripe doesn't retry endlessly
        } else {
          console.log('✅ Checkout processed successfully')
        }
        
        break
      }
      
      // =====================================================
      // Monthly subscription payment succeeded
      // =====================================================
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice & { 
          subscription?: string | Stripe.Subscription | null
          payment_intent?: string | Stripe.PaymentIntent | null
        }
        
        // Only process subscription invoices (not one-time payments)
        if (invoice.subscription) {
          console.log('💰 Processing invoice.paid (subscription renewal)...')
          console.log(`   Invoice ID: ${invoice.id}`)
          console.log(`   Subscription: ${invoice.subscription}`)
          
          const result = await StripeService.handleInvoicePaid(invoice)
          
          if (!result.success) {
            console.error('❌ Failed to handle invoice:', result.error)
          } else {
            console.log('✅ Subscription renewal processed successfully')
          }
        }
        
        break
      }
      
      // =====================================================
      // Subscription status changed (e.g., payment failed, canceled, etc.)
      // =====================================================
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        console.log('🔄 Processing subscription.updated...')
        console.log(`   Subscription ID: ${subscription.id}`)
        console.log(`   Status: ${subscription.status}`)
        
        // Update subscription status in database
        try {
          const { error } = await supabaseAdmin
            .from('user_subscriptions')
            .update({
              status: subscription.status,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end ?? false,
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', subscription.id)
          
          if (error) {
            console.error('❌ Failed to update subscription status:', error)
          } else {
            console.log('✅ Subscription status updated')
          }
        } catch (err) {
          console.error('❌ Error updating subscription:', err)
        }
        
        break
      }
      
      // =====================================================
      // Subscription was canceled
      // =====================================================
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        console.log('❌ Processing subscription.deleted...')
        console.log(`   Subscription ID: ${subscription.id}`)
        
        const result = await StripeService.handleSubscriptionDeleted(subscription)
        
        if (!result.success) {
          console.error('❌ Failed to handle subscription deletion:', result.error)
        } else {
          console.log('✅ Subscription cancellation processed successfully')
        }
        
        break
      }
      
      // =====================================================
      // Other events (we don't handle these yet, but log them)
      // =====================================================
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`)
    }
    
    // Always return 200 to Stripe (even if processing failed)
    // This prevents Stripe from retrying endlessly
    // We can manually fix issues by checking logs
    return NextResponse.json({ received: true })
    
  } catch (error: any) {
    console.error('❌ Webhook error:', error)
    
    // Return 200 even on error to prevent endless retries
    // Log the error for manual investigation
    return NextResponse.json({ 
      received: true,
      error: error.message 
    })
  }
}





