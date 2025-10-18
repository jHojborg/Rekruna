/**
 * CREDITS SERVICE
 * 
 * Handles all credit operations for the CV screening platform.
 * 
 * Business Rules:
 * 1. Always deduct from subscription_credits FIRST (they expire monthly)
 * 2. Then deduct from purchased_credits SECOND (they're lifetime)
 * 3. Check credits BEFORE analysis starts
 * 4. Auto-refund if analysis fails
 * 
 * Return Pattern:
 * All methods return { success: boolean, data/error } - never throws errors
 */

import { supabaseAdmin } from '@/lib/supabase/server'

// =====================================================
// TYPE DEFINITIONS
// =====================================================

// Success response with data
type SuccessResponse<T> = {
  success: true
  data: T
}

// Error response
type ErrorResponse = {
  success: false
  error: string
}

// Combined response type
type ServiceResponse<T> = SuccessResponse<T> | ErrorResponse

// Credit balance from database
type CreditBalance = {
  user_id: string
  subscription_credits: number
  purchased_credits: number
  total_credits: number
  last_subscription_reset: string | null
}

// Transaction record
type CreditTransaction = {
  id: string
  user_id: string
  amount: number
  balance_after: number
  credit_type: 'subscription' | 'purchased'
  transaction_type: 'purchase' | 'subscription_allocation' | 'deduction' | 'refund' | 'subscription_reset'
  stripe_payment_intent_id?: string
  analysis_id?: string
  description: string
  created_at: string
}

// =====================================================
// CREDITS SERVICE CLASS
// =====================================================

export class CreditsService {
  
  /**
   * METHOD 1: Check if user has enough credits
   * 
   * This method checks if a user can afford to analyze a certain number of CVs.
   * It does NOT deduct credits - only checks availability.
   * 
   * @param userId - The user's ID from auth.users
   * @param requiredAmount - Number of credits needed (usually = number of CVs)
   * @returns Object with hasCredits flag and balance details
   */
  static async hasEnoughCredits(
    userId: string,
    requiredAmount: number
  ): Promise<ServiceResponse<{
    hasCredits: boolean
    currentBalance: number
    subscriptionCredits: number
    purchasedCredits: number
    required: number
    shortfall: number // How many credits user is missing (0 if hasCredits = true)
  }>> {
    
    // Validate input
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required'
      }
    }

    if (requiredAmount <= 0) {
      return {
        success: false,
        error: 'Required amount must be greater than 0'
      }
    }

    try {
      // Get user's current credit balance from database
      const { data: balance, error: balanceError } = await supabaseAdmin
        .from('credit_balances')
        .select('*')
        .eq('user_id', userId)
        .single()

      // Handle errors
      if (balanceError) {
        return {
          success: false,
          error: `Failed to fetch credit balance: ${balanceError.message}`
        }
      }

      // User doesn't have a balance record yet
      if (!balance) {
        return {
          success: false,
          error: 'User credit balance not found. Please contact support.'
        }
      }

      // Calculate if user has enough credits
      const currentBalance = balance.total_credits
      const hasCredits = currentBalance >= requiredAmount
      const shortfall = hasCredits ? 0 : requiredAmount - currentBalance

      // Return success with detailed balance info
      return {
        success: true,
        data: {
          hasCredits,
          currentBalance,
          subscriptionCredits: balance.subscription_credits,
          purchasedCredits: balance.purchased_credits,
          required: requiredAmount,
          shortfall
        }
      }

    } catch (error) {
      // Catch any unexpected errors
      return {
        success: false,
        error: `Unexpected error checking credits: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * METHOD 2: Deduct credits from user balance
   * 
   * This method deducts credits BEFORE analysis starts.
   * It follows the priority rule: subscription credits first, then purchased.
   * 
   * CRITICAL: Always call hasEnoughCredits() BEFORE this method!
   * 
   * @param userId - The user's ID
   * @param analysisId - Unique ID for this analysis (for audit trail)
   * @param amount - Number of credits to deduct
   * @returns Object with deduction details and new balance
   */
  static async deductCredits(
    userId: string,
    analysisId: string,
    amount: number
  ): Promise<ServiceResponse<{
    deducted: number
    balanceAfter: number
    transactions: Array<{
      creditType: 'subscription' | 'purchased'
      amount: number
    }>
  }>> {

    // Validate input
    if (!userId || !analysisId) {
      return {
        success: false,
        error: 'User ID and Analysis ID are required'
      }
    }

    if (amount <= 0) {
      return {
        success: false,
        error: 'Deduction amount must be greater than 0'
      }
    }

    try {
      // Step 1: Get current balance
      const { data: balance, error: balanceError } = await supabaseAdmin
        .from('credit_balances')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (balanceError || !balance) {
        return {
          success: false,
          error: 'Failed to fetch user credit balance'
        }
      }

      // Step 2: Check if user has enough credits
      if (balance.total_credits < amount) {
        return {
          success: false,
          error: `Insufficient credits. Required: ${amount}, Available: ${balance.total_credits}`
        }
      }

      // Step 3: Calculate deduction strategy
      // Priority: Use subscription_credits FIRST, then purchased_credits
      
      let subscriptionDeduction = 0
      let purchasedDeduction = 0
      let remainingToDeduct = amount

      // Try to deduct from subscription credits first
      if (balance.subscription_credits > 0) {
        subscriptionDeduction = Math.min(balance.subscription_credits, remainingToDeduct)
        remainingToDeduct -= subscriptionDeduction
      }

      // If still need more, deduct from purchased credits
      if (remainingToDeduct > 0) {
        purchasedDeduction = remainingToDeduct
      }

      // Step 4: Update the balance in database
      const newSubscriptionCredits = balance.subscription_credits - subscriptionDeduction
      const newPurchasedCredits = balance.purchased_credits - purchasedDeduction
      const newTotalCredits = newSubscriptionCredits + newPurchasedCredits

      const { error: updateError } = await supabaseAdmin
        .from('credit_balances')
        .update({
          subscription_credits: newSubscriptionCredits,
          purchased_credits: newPurchasedCredits,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (updateError) {
        return {
          success: false,
          error: `Failed to update credit balance: ${updateError.message}`
        }
      }

      // Step 5: Log transactions for audit trail
      const transactions: Array<{
        creditType: 'subscription' | 'purchased'
        amount: number
      }> = []

      // Log subscription deduction if any
      if (subscriptionDeduction > 0) {
        const { error: txError } = await supabaseAdmin
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: -subscriptionDeduction, // Negative for deduction
            balance_after: newTotalCredits,
            credit_type: 'subscription',
            transaction_type: 'deduction',
            analysis_id: analysisId,
            description: `Deducted ${subscriptionDeduction} subscription credits for analysis ${analysisId}`
          })

        if (txError) {
          console.error('Failed to log subscription transaction:', txError)
          // Continue anyway - balance is already updated
        }

        transactions.push({
          creditType: 'subscription',
          amount: subscriptionDeduction
        })
      }

      // Log purchased deduction if any
      if (purchasedDeduction > 0) {
        const { error: txError } = await supabaseAdmin
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: -purchasedDeduction, // Negative for deduction
            balance_after: newTotalCredits,
            credit_type: 'purchased',
            transaction_type: 'deduction',
            analysis_id: analysisId,
            description: `Deducted ${purchasedDeduction} purchased credits for analysis ${analysisId}`
          })

        if (txError) {
          console.error('Failed to log purchased transaction:', txError)
          // Continue anyway - balance is already updated
        }

        transactions.push({
          creditType: 'purchased',
          amount: purchasedDeduction
        })
      }

      // Step 6: Return success
      return {
        success: true,
        data: {
          deducted: amount,
          balanceAfter: newTotalCredits,
          transactions
        }
      }

    } catch (error) {
      return {
        success: false,
        error: `Unexpected error deducting credits: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * METHOD 3: Refund credits if analysis fails
   * 
   * This method refunds credits when analysis fails due to system errors.
   * It finds the original deduction and reverses it.
   * 
   * @param userId - The user's ID
   * @param analysisId - The analysis ID that failed
   * @param amount - Number of credits to refund
   * @param reason - Why the refund is happening (for audit log)
   * @returns Object with refund details
   */
  static async refundAnalysis(
    userId: string,
    analysisId: string,
    amount: number,
    reason: string
  ): Promise<ServiceResponse<{
    refunded: number
    balanceAfter: number
    originalTransactions: Array<{
      creditType: 'subscription' | 'purchased'
      amount: number
    }>
  }>> {

    // Validate input
    if (!userId || !analysisId) {
      return {
        success: false,
        error: 'User ID and Analysis ID are required'
      }
    }

    if (amount <= 0) {
      return {
        success: false,
        error: 'Refund amount must be greater than 0'
      }
    }

    try {
      // Step 1: Find original deduction transaction(s)
      const { data: originalTransactions, error: txError } = await supabaseAdmin
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('analysis_id', analysisId)
        .eq('transaction_type', 'deduction')
        .order('created_at', { ascending: true })

      if (txError) {
        return {
          success: false,
          error: `Failed to find original transactions: ${txError.message}`
        }
      }

      if (!originalTransactions || originalTransactions.length === 0) {
        return {
          success: false,
          error: `No deduction found for analysis_id: ${analysisId}`
        }
      }

      // Step 2: Get current balance
      const { data: balance, error: balanceError } = await supabaseAdmin
        .from('credit_balances')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (balanceError || !balance) {
        return {
          success: false,
          error: 'Failed to fetch current balance'
        }
      }

      // Step 3: Calculate refund strategy
      // Refund in REVERSE order of how it was deducted
      // If deducted from subscription first, refund to subscription first
      
      let subscriptionRefund = 0
      let purchasedRefund = 0

      // Process original transactions to determine refund distribution
      originalTransactions.forEach((tx: CreditTransaction) => {
        if (tx.credit_type === 'subscription') {
          subscriptionRefund += Math.abs(tx.amount) // Convert negative to positive
        } else if (tx.credit_type === 'purchased') {
          purchasedRefund += Math.abs(tx.amount)
        }
      })

      // Step 4: Update balance
      const newSubscriptionCredits = balance.subscription_credits + subscriptionRefund
      const newPurchasedCredits = balance.purchased_credits + purchasedRefund
      const newTotalCredits = newSubscriptionCredits + newPurchasedCredits

      const { error: updateError } = await supabaseAdmin
        .from('credit_balances')
        .update({
          subscription_credits: newSubscriptionCredits,
          purchased_credits: newPurchasedCredits,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (updateError) {
        return {
          success: false,
          error: `Failed to update balance: ${updateError.message}`
        }
      }

      // Step 5: Log refund transactions
      const refundTransactions: Array<{
        creditType: 'subscription' | 'purchased'
        amount: number
      }> = []

      // Log subscription refund if any
      if (subscriptionRefund > 0) {
        await supabaseAdmin
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: subscriptionRefund, // Positive for refund
            balance_after: newTotalCredits,
            credit_type: 'subscription',
            transaction_type: 'refund',
            analysis_id: analysisId,
            description: `Refund: ${reason}`
          })

        refundTransactions.push({
          creditType: 'subscription',
          amount: subscriptionRefund
        })
      }

      // Log purchased refund if any
      if (purchasedRefund > 0) {
        await supabaseAdmin
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: purchasedRefund, // Positive for refund
            balance_after: newTotalCredits,
            credit_type: 'purchased',
            transaction_type: 'refund',
            analysis_id: analysisId,
            description: `Refund: ${reason}`
          })

        refundTransactions.push({
          creditType: 'purchased',
          amount: purchasedRefund
        })
      }

      // Step 6: Return success
      return {
        success: true,
        data: {
          refunded: amount,
          balanceAfter: newTotalCredits,
          originalTransactions: refundTransactions
        }
      }

    } catch (error) {
      return {
        success: false,
        error: `Unexpected error refunding credits: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * HELPER METHOD: Initialize credit balance for new user
   * 
   * Call this when a new user signs up (before they purchase anything).
   * Creates a credit_balances record with 0 credits.
   * 
   * @param userId - The new user's ID
   * @returns Success/error response
   */
  static async initializeBalance(
    userId: string
  ): Promise<ServiceResponse<{
    userId: string
    initialBalance: number
  }>> {

    if (!userId) {
      return {
        success: false,
        error: 'User ID is required'
      }
    }

    try {
      // Check if balance already exists
      const { data: existing } = await supabaseAdmin
        .from('credit_balances')
        .select('user_id')
        .eq('user_id', userId)
        .single()

      if (existing) {
        return {
          success: true,
          data: {
            userId,
            initialBalance: 0
          }
        }
      }

      // Create new balance record
      const { error: insertError } = await supabaseAdmin
        .from('credit_balances')
        .insert({
          user_id: userId,
          subscription_credits: 0,
          purchased_credits: 0
        })

      if (insertError) {
        return {
          success: false,
          error: `Failed to initialize balance: ${insertError.message}`
        }
      }

      return {
        success: true,
        data: {
          userId,
          initialBalance: 0
        }
      }

    } catch (error) {
      return {
        success: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * HELPER METHOD: Get user's current balance
   * 
   * Simple balance lookup with no complex logic.
   * 
   * @param userId - The user's ID
   * @returns Current balance details
   */
  static async getBalance(
    userId: string
  ): Promise<ServiceResponse<{
    subscriptionCredits: number
    purchasedCredits: number
    totalCredits: number
    lastSubscriptionReset: string | null
  }>> {

    if (!userId) {
      return {
        success: false,
        error: 'User ID is required'
      }
    }

    try {
      const { data: balance, error } = await supabaseAdmin
        .from('credit_balances')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error || !balance) {
        return {
          success: false,
          error: 'User credit balance not found'
        }
      }

      return {
        success: true,
        data: {
          subscriptionCredits: balance.subscription_credits,
          purchasedCredits: balance.purchased_credits,
          totalCredits: balance.total_credits,
          lastSubscriptionReset: balance.last_subscription_reset
        }
      }

    } catch (error) {
      return {
        success: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}





