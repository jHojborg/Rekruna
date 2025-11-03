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
import { CreditsService } from './credits.service'

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

type ProductTier = 'pay_as_you_go' | 'pro' | 'business' | 'boost_50' | 'boost_100' | 'boost_250' | 'boost_500'

// Extended Stripe types with missing properties
interface StripeInvoiceExtended extends Stripe.Invoice {
  subscription?: string | Stripe.Subscription | null
  payment_intent?: string | Stripe.PaymentIntent | null
}

// =====================================================
// CREDIT CONFIGURATION
// Map Price IDs to credit amounts (since we're not using Stripe metadata)
// =====================================================

type ProductConfig = {
  credits: number
  tier: ProductTier
  type: 'one_time' | 'subscription' | 'top_up'
  isSubscription: boolean
}

function getPriceConfig(priceId: string): ProductConfig | null {
  const config: Record<string, ProductConfig> = {
    [process.env.STRIPE_PAYG_PRICE_ID || '']: {
      credits: 200,
      tier: 'pay_as_you_go',
      type: 'one_time',
      isSubscription: false
    },
    [process.env.STRIPE_PRO_PRICE_ID || '']: {
      credits: 400,
      tier: 'pro',
      type: 'subscription',
      isSubscription: true
    },
    [process.env.STRIPE_BUSINESS_PRICE_ID || '']: {
      credits: 1000,
      tier: 'business',
      type: 'subscription',
      isSubscription: true
    },
    [process.env.STRIPE_BOOST_50_PRICE_ID || '']: {
      credits: 50,
      tier: 'boost_50',
      type: 'top_up',
      isSubscription: false
    },
    [process.env.STRIPE_BOOST_100_PRICE_ID || '']: {
      credits: 100,
      tier: 'boost_100',
      type: 'top_up',
      isSubscription: false
    },
    [process.env.STRIPE_BOOST_250_PRICE_ID || '']: {
      credits: 250,
      tier: 'boost_250',
      type: 'top_up',
      isSubscription: false
    },
    [process.env.STRIPE_BOOST_500_PRICE_ID || '']: {
      credits: 500,
      tier: 'boost_500',
      type: 'top_up',
      isSubscription: false
    }
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
          product_tier: 'pay_as_you_go', // Default, will update when they subscribe
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
      
      const credits = productConfig.credits
      const tier = productConfig.tier
      const type = productConfig.type
      
      // Handle based on type
      if (type === 'subscription') {
        // This is a subscription (Pro or Business)
        const subscriptionId = session.subscription as string
        
        // Update user_subscriptions table
        const { error: subError } = await supabaseAdmin
          .from('user_subscriptions')
          .update({
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
            product_tier: tier,
            monthly_credit_allocation: credits,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // ~30 days
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
        
        if (subError) {
          console.error('Failed to update subscription:', subError)
          return {
            success: false,
            error: 'Failed to update subscription'
          }
        }
        
        // Get or create credit balance for subscription
        let { data: balance } = await supabaseAdmin
          .from('credit_balances')
          .select('*')
          .eq('user_id', userId)
          .single()
        
        // Initialize balance if doesn't exist
        if (!balance) {
          console.log(`Initializing credit balance for subscription user ${userId}`)
          await CreditsService.initializeBalance(userId)
          
          // Re-fetch the balance after initialization
          const { data: newBalance } = await supabaseAdmin
            .from('credit_balances')
            .select('*')
            .eq('user_id', userId)
            .single()
          
          balance = newBalance
        }
        
        // Safety check
        if (!balance) {
          console.error('Failed to get or create balance for user:', userId)
          return {
            success: false,
            error: 'Failed to initialize credit balance'
          }
        }
        
        // Set subscription credits (not add, but set to allocation)
        const { error: creditError } = await supabaseAdmin
          .from('credit_balances')
          .update({
            subscription_credits: credits,
            last_subscription_reset: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
        
        if (creditError) {
          console.error('Failed to update subscription credits:', creditError)
          return {
            success: false,
            error: 'Failed to update credits'
          }
        }
        
        // Calculate new total (subscription credits + existing purchased credits)
        const newTotalCredits = credits + balance.purchased_credits
        
        // Log transaction
        await supabaseAdmin
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: credits,
            balance_after: newTotalCredits,
            credit_type: 'subscription',
            transaction_type: 'subscription_allocation',
            stripe_payment_intent_id: session.payment_intent as string,
            description: `${tier.toUpperCase()} subscription activated (${credits} credits)`
          })
        
        console.log(`✅ Subscription activated for user ${userId}: ${credits} credits`)
        console.log(`   Subscription: ${credits} | Purchased: ${balance.purchased_credits} | Total: ${newTotalCredits}`)
        
      } else {
        // This is a one-time payment (Pay as you go or Top-up)
        
        // Step 1: Get or create credit balance
        let { data: balance } = await supabaseAdmin
          .from('credit_balances')
          .select('*')
          .eq('user_id', userId)
          .single()
        
        // If balance doesn't exist, initialize it
        if (!balance) {
          console.log(`Initializing credit balance for user ${userId}`)
          await CreditsService.initializeBalance(userId)
          
          // Re-fetch the balance after initialization
          const { data: newBalance } = await supabaseAdmin
            .from('credit_balances')
            .select('*')
            .eq('user_id', userId)
            .single()
          
          balance = newBalance
        }
        
        // Safety check - balance should exist now
        if (!balance) {
          console.error('Failed to get or create balance for user:', userId)
          return {
            success: false,
            error: 'Failed to initialize credit balance'
          }
        }
        
        // Step 2: Add credits to purchased_credits
        const newPurchasedCredits = balance.purchased_credits + credits
        
        const { error: creditError } = await supabaseAdmin
          .from('credit_balances')
          .update({
            purchased_credits: newPurchasedCredits,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
        
        if (creditError) {
          console.error('Failed to add credits:', creditError)
          return {
            success: false,
            error: 'Failed to add credits'
          }
        }
        
        // Step 3: Calculate new total for transaction log
        const newTotalCredits = balance.subscription_credits + newPurchasedCredits
        
        // Step 4: Update user_subscriptions status to 'active' for pay_as_you_go
        // This ensures the user's plan shows as active after purchase
        if (type === 'one_time' && tier === 'pay_as_you_go') {
          await supabaseAdmin
            .from('user_subscriptions')
            .update({
              product_tier: 'pay_as_you_go',
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
          
          console.log(`✅ Updated subscription status to 'active' for pay_as_you_go user ${userId}`)
        }
        
        // Step 5: Log transaction
        await supabaseAdmin
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: credits,
            balance_after: newTotalCredits,
            credit_type: 'purchased',
            transaction_type: 'purchase',
            stripe_payment_intent_id: session.payment_intent as string,
            description: `Purchased ${credits} credits (${tier})`
          })
        
        console.log(`✅ One-time purchase for user ${userId}: ${credits} credits added`)
        console.log(`   Previous: ${balance.purchased_credits} | New: ${newPurchasedCredits} | Total: ${newTotalCredits}`)
      }
      
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
   * 
   * Called from webhook when invoice is paid.
   * Resets subscription credits to monthly allocation.
   */
  static async handleInvoicePaid(invoice: StripeInvoiceExtended): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const subscriptionId = invoice.subscription as string
      
      if (!subscriptionId) {
        return { success: true } // Not a subscription invoice, skip
      }
      
      // Find user by subscription ID
      const { data: subscription } = await supabaseAdmin
        .from('user_subscriptions')
        .select('*')
        .eq('stripe_subscription_id', subscriptionId)
        .single()
      
      if (!subscription) {
        return {
          success: false,
          error: 'Subscription not found'
        }
      }
      
      const userId = subscription.user_id
      const credits = subscription.monthly_credit_allocation
      
      // Get or create credit balance
      let { data: balance } = await supabaseAdmin
        .from('credit_balances')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      // Initialize if doesn't exist (shouldn't happen, but safety check)
      if (!balance) {
        console.log(`Initializing credit balance for renewal user ${userId}`)
        await CreditsService.initializeBalance(userId)
        
        // Re-fetch
        const { data: newBalance } = await supabaseAdmin
          .from('credit_balances')
          .select('*')
          .eq('user_id', userId)
          .single()
        
        balance = newBalance
      }
      
      if (!balance) {
        console.error('Failed to get balance for renewal:', userId)
        return {
          success: false,
          error: 'Failed to get credit balance'
        }
      }
      
      // Reset subscription credits to monthly allocation (not add!)
      const { error: creditError } = await supabaseAdmin
        .from('credit_balances')
        .update({
          subscription_credits: credits, // RESET to allocation
          last_subscription_reset: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
      
      if (creditError) {
        console.error('Failed to reset subscription credits:', creditError)
        return {
          success: false,
          error: 'Failed to reset credits'
        }
      }
      
      // Calculate new total after reset
      const newTotalCredits = credits + balance.purchased_credits
      
      // Log transaction
      await supabaseAdmin
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: credits,
          balance_after: newTotalCredits,
          credit_type: 'subscription',
          transaction_type: 'subscription_reset',
          stripe_payment_intent_id: invoice.payment_intent as string,
          description: `Monthly ${subscription.product_tier.toUpperCase()} subscription renewed (${credits} credits)`
        })
      
      console.log(`✅ Subscription renewed for user ${userId}: ${credits} credits`)
      console.log(`   Old subscription credits lost, new allocation: ${credits} | Purchased kept: ${balance.purchased_credits} | Total: ${newTotalCredits}`)
      
      return { success: true }
      
    } catch (error: any) {
      console.error('handleInvoicePaid error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  /**
   * Handle subscription cancellation
   * 
   * Called from webhook when subscription is deleted.
   * Removes subscription credits but keeps purchased credits.
   */
  static async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const subscriptionId = subscription.id
      
      // Find user by subscription ID
      const { data: userSub } = await supabaseAdmin
        .from('user_subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscriptionId)
        .single()
      
      if (!userSub) {
        return {
          success: false,
          error: 'Subscription not found'
        }
      }
      
      const userId = userSub.user_id
      
      // Update subscription status
      await supabaseAdmin
        .from('user_subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscriptionId)
      
      // Remove subscription credits (keep purchased!)
      await supabaseAdmin
        .from('credit_balances')
        .update({
          subscription_credits: 0,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
      
      console.log(`✅ Subscription canceled for user ${userId}`)
      
      return { success: true }
      
    } catch (error: any) {
      console.error('handleSubscriptionDeleted error:', error)
      return {
        success: false,
        error: error.message
      }
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

