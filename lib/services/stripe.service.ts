/**
 * STRIPE SERVICE
 * 
 * Handles all Stripe-related operations:
 * - Creating checkout sessions
 * - Managing customers
 * - Processing webhooks
 * - Adding credits after payment
 * 
 * Security: 
 * - NEVER expose secret key to client
 * - ALWAYS verify webhook signatures
 * - NEVER trust client-provided amounts
 */

import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/server'

// Lazy initialization - only create Stripe instance when needed (not during build)
let stripeInstance: Stripe | null = null

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      // Using default API version from Stripe SDK
      typescript: true,
    })
  }
  return stripeInstance
}

// =====================================================
// TYPE DEFINITIONS
// =====================================================

// Phase 3: Rekruna 1/5/10 - alle engangsbetalinger
type ProductTier = 'rekruna_1' | 'rekruna_5' | 'rekruna_10'

// Extended Stripe types with missing properties
interface StripeInvoiceExtended extends Stripe.Invoice {
  subscription?: string | Stripe.Subscription | null
  payment_intent?: string | Stripe.PaymentIntent | null
}

// =====================================================
// PRODUCT CONFIGURATION
// Phase 3: Rekruna 1 (2495 kr), 5 (9995 kr), 10 (17995 kr)
// Alle engangsbetalinger. job_slots = antal stillingsopslag.
// =====================================================

type ProductConfig = {
  tier: ProductTier
  type: 'one_time' | 'subscription'
  isSubscription: boolean
  jobSlots: number
}

function getPriceConfig(priceId: string): ProductConfig | null {
  const config: Record<string, ProductConfig> = {
    [process.env.STRIPE_REKRUNA_1_PRICE_ID || '']: {
      tier: 'rekruna_1',
      type: 'one_time',
      isSubscription: false,
      jobSlots: 1
    },
    [process.env.STRIPE_REKRUNA_5_PRICE_ID || '']: {
      tier: 'rekruna_5',
      type: 'one_time',
      isSubscription: false,
      jobSlots: 5
    },
    [process.env.STRIPE_REKRUNA_10_PRICE_ID || '']: {
      tier: 'rekruna_10',
      type: 'one_time',
      isSubscription: false,
      jobSlots: 10
    },
  }
  
  return config[priceId] || null
}

type CreateCheckoutParams = {
  userId: string
  userEmail: string
  priceId: string
  tier: ProductTier
  successUrl: string
  cancelUrl: string
  profile?: {
    company_name: string
    address: string
    postal_code: string
    city: string
  }
}

// =====================================================
// STRIPE SERVICE CLASS
// =====================================================

export class StripeService {
  
  /**
   * Get or create a Stripe customer for a user
   * 
   * Why? Each user needs a Stripe customer ID to make purchases.
   * We store this in user_subscriptions table.
   */
  static async getOrCreateCustomer(userId: string, email: string): Promise<{
    success: true
    data: { customerId: string }
  } | {
    success: false
    error: string
  }> {
    try {
      // Check if user already has a Stripe customer
      const { data: existing } = await supabaseAdmin
        .from('user_subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single()
      
      // If we have a customer ID, verify it exists in Stripe
      if (existing?.stripe_customer_id) {
        try {
          // Try to retrieve customer from Stripe to verify it exists
          await getStripe().customers.retrieve(existing.stripe_customer_id)
          
          // Customer exists! Return it
          return {
            success: true,
            data: { customerId: existing.stripe_customer_id }
          }
        } catch (error: any) {
          // Customer doesn't exist in Stripe (e.g., was from test mode)
          // We'll create a new one below
          console.log(`Customer ${existing.stripe_customer_id} not found in Stripe, creating new one`)
        }
      }
      
      // Create new Stripe customer
      const customer = await getStripe().customers.create({
        email,
        metadata: {
          user_id: userId // Link back to our user
        }
      })
      
      // Store customer ID in database (upsert to handle existing records)
      // Note: We'll create the full subscription record when they actually subscribe
      const { error: upsertError } = await supabaseAdmin
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: customer.id,
          product_tier: 'rekruna_1', // Default placeholder, will update when they purchase
          status: 'incomplete'
        }, {
          onConflict: 'user_id' // Update existing record if user_id already exists
        })
        .select()
        .single()
      
      if (upsertError) {
        console.error('Failed to store customer ID:', upsertError)
        return {
          success: false,
          error: 'Failed to create customer record'
        }
      }
      
      return {
        success: true,
        data: { customerId: customer.id }
      }
      
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to create Stripe customer: ${error.message}`
      }
    }
  }
  
  /**
   * Create a Stripe Checkout session
   * 
   * This generates a URL that we redirect the user to for payment.
   * Stripe handles the payment form, we just get notified when it's done.
   */
  static async createCheckoutSession(params: CreateCheckoutParams): Promise<{
    success: true
    data: { url: string }
  } | {
    success: false
    error: string
  }> {
    try {
      // Get or create Stripe customer
      const customerResult = await this.getOrCreateCustomer(params.userId, params.userEmail)
      
      if (!customerResult.success) {
        return {
          success: false,
          error: customerResult.error
        }
      }
      
      const customerId = customerResult.data.customerId
      
      // Update customer with profile data if provided (pre-fills Stripe checkout)
      if (params.profile) {
        await getStripe().customers.update(customerId, {
          name: params.profile.company_name,
          address: {
            line1: params.profile.address,
            postal_code: params.profile.postal_code,
            city: params.profile.city,
            country: 'DK'
          }
        })
      }
      
      // Get product config to check if this is a top-up
      const productConfig = getPriceConfig(params.priceId)
      
      if (!productConfig) {
        return {
          success: false,
          error: 'Invalid price ID. Product not configured.'
        }
      }
      
      // Top-ups are now available for all users (not just Pro/Business)
      // Removed subscription check to allow everyone to purchase boost credits
      
      // Determine mode based on product config
      const isSubscription = productConfig.isSubscription
      
      // Create Stripe checkout session
      // Note: When using 'customer', do NOT use 'customer_email' - Stripe uses email from customer object
      const session = await getStripe().checkout.sessions.create({
        customer: customerId,
        mode: isSubscription ? 'subscription' : 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          }
        ],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        billing_address_collection: 'auto', // Show billing address fields
        // Enable automatic tax calculation (requires Stripe Tax to be enabled in dashboard)
        automatic_tax: {
          enabled: true
        },
        // Phone number collection for better customer support
        phone_number_collection: {
          enabled: true
        },
        metadata: {
          user_id: params.userId,
          tier: params.tier,
        },
        // For subscriptions, add subscription_data
        ...(isSubscription && {
          subscription_data: {
            metadata: {
              user_id: params.userId,
              tier: params.tier,
            }
          }
        })
      })
      
      if (!session.url) {
        return {
          success: false,
          error: 'Failed to create checkout session URL'
        }
      }
      
      return {
        success: true,
        data: { url: session.url }
      }
      
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to create checkout session: ${error.message}`
      }
    }
  }
  
  /**
   * Handle successful checkout
   * 
   * Called from webhook when payment succeeds.
   * Adds credits and updates subscription status.
   */
  static async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const userId = session.metadata?.user_id
      
      if (!userId) {
        return {
          success: false,
          error: 'No user_id in session metadata'
        }
      }
      
      // CRITICAL: Verify payment was actually completed
      // checkout.session.completed fires even if payment failed or wasn't required
      if (session.payment_status !== 'paid') {
        console.warn(`⚠️ Checkout session ${session.id} completed but payment status is: ${session.payment_status}`)
        console.warn(`   User: ${userId} - NOT adding credits until payment is confirmed`)
        return {
          success: false,
          error: `Payment not completed. Status: ${session.payment_status}`
        }
      }
      
      console.log(`✅ Payment confirmed for session ${session.id} (status: ${session.payment_status})`)
      
      // =====================================================
      // EVENT → STANDARD CONVERSION
      // If this is an EVENT customer making their first purchase,
      // convert them to a STANDARD customer
      // =====================================================
      
      const { data: userProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('account_type, is_active')
        .eq('user_id', userId)
        .single()
      
      if (userProfile?.account_type === 'EVENT') {
        console.log(`🔄 Converting EVENT customer ${userId} to STANDARD after purchase`)
        
        // Update profile: Convert to STANDARD and activate
        const { error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .update({
            account_type: 'STANDARD',
            is_active: true,
            // Clear EVENT-specific fields
            event_expiry_date: null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
        
        if (profileError) {
          console.error('Failed to convert EVENT to STANDARD:', profileError)
          // Continue anyway - payment succeeded
        } else {
          console.log(`✅ EVENT customer ${userId} converted to STANDARD successfully`)
        }
      }
      
      // Get the price ID from the session
      const lineItems = await getStripe().checkout.sessions.listLineItems(session.id)
      const priceId = lineItems.data[0]?.price?.id
      
      if (!priceId) {
        return {
          success: false,
          error: 'No price ID found in session'
        }
      }
      
      // Get product config from our hardcoded mapping
      const productConfig = getPriceConfig(priceId)
      
      if (!productConfig) {
        return {
          success: false,
          error: `Unknown price ID: ${priceId}. Please check environment variables.`
        }
      }
      
      const tier = productConfig.tier
      const jobSlots = productConfig.jobSlots
      
      // Phase 3: All packages are one-time. Set job_slots_available for Phase 4 (75-day flow).
      const { error: subError } = await supabaseAdmin
        .from('user_subscriptions')
        .update({
          stripe_subscription_id: null,
          stripe_price_id: priceId,
          product_tier: tier,
          monthly_credit_allocation: null,
          job_slots_available: jobSlots,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
      
      if (subError) {
        console.error('Failed to update purchase:', subError)
        return { success: false, error: 'Failed to update purchase' }
      }
      
      console.log(`✅ Purchase completed for user ${userId}: ${tier} (${jobSlots} job slots)`)
      
      return { success: true }
      
    } catch (error: any) {
      console.error('handleCheckoutCompleted error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  /**
   * Handle subscription renewal (monthly payment)
   * Phase 1: Credits removed - just log renewal
   */
  static async handleInvoicePaid(invoice: StripeInvoiceExtended): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const subscriptionId = invoice.subscription as string
      
      if (!subscriptionId) {
        return { success: true }
      }
      
      const { data: subscription } = await supabaseAdmin
        .from('user_subscriptions')
        .select('user_id, product_tier')
        .eq('stripe_subscription_id', subscriptionId)
        .single()
      
      if (!subscription) {
        return { success: false, error: 'Subscription not found' }
      }
      
      console.log(`✅ Subscription renewed for user ${subscription.user_id}: ${subscription.product_tier}`)
      return { success: true }
      
    } catch (error: any) {
      console.error('handleInvoicePaid error:', error)
      return { success: false, error: error.message }
    }
  }
  
  /**
   * Handle subscription cancellation
   * Phase 1: Credits removed - only update subscription status
   */
  static async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const subscriptionId = subscription.id
      
      const { data: userSub } = await supabaseAdmin
        .from('user_subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscriptionId)
        .single()
      
      if (!userSub) {
        return { success: false, error: 'Subscription not found' }
      }
      
      await supabaseAdmin
        .from('user_subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscriptionId)
      
      console.log(`✅ Subscription canceled for user ${userSub.user_id}`)
      return { success: true }
      
    } catch (error: any) {
      console.error('handleSubscriptionDeleted error:', error)
      return { success: false, error: error.message }
    }
  }
  
  /**
   * Verify webhook signature
   * 
   * CRITICAL FOR SECURITY!
   * This ensures the webhook actually came from Stripe, not a hacker.
   */
  static constructWebhookEvent(body: string, signature: string): {
    success: true
    data: Stripe.Event
  } | {
    success: false
    error: string
  } {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
      
      if (!webhookSecret) {
        return {
          success: false,
          error: 'Missing STRIPE_WEBHOOK_SECRET'
        }
      }
      
      const event = getStripe().webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      )
      
      return {
        success: true,
        data: event
      }
      
    } catch (error: any) {
      return {
        success: false,
        error: `Webhook signature verification failed: ${error.message}`
      }
    }
  }
}

