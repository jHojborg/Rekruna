"use client"
import { useEffect, useState } from 'react'
import { CreditCard, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'

interface CreditsCardProps {
  userId: string
}

export function CreditsCard({ userId }: CreditsCardProps) {
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState<{
    total: number
    subscription: number
    purchased: number
    tier?: string
  } | null>(null)
  const [loadingTopup, setLoadingTopup] = useState<string | null>(null)

  useEffect(() => {
    loadCredits()
  }, [userId])

  const loadCredits = async () => {
    try {
      setLoading(true)
      
      // Get credit balance
      const { data: balance, error } = await supabase
        .from('credit_balances')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading credits:', error)
        return
      }
      
      // Get subscription info
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('product_tier, status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()
      
      if (balance) {
        setCredits({
          total: balance.total_credits,
          subscription: balance.subscription_credits,
          purchased: balance.purchased_credits,
          tier: subscription?.product_tier
        })
      }
    } catch (error) {
      console.error('Error loading credits:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTopup = async (tier: 'boost_50' | 'boost_100' | 'boost_250' | 'boost_500') => {
    try {
      setLoadingTopup(tier)
      
      // Call checkout API
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }
      
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Topup error:', error)
      alert('Der skete en fejl. Prøv igen.')
    } finally {
      setLoadingTopup(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      </div>
    )
  }

  const isPro = credits?.tier === 'pro'
  const isBusiness = credits?.tier === 'business'
  const canBuyTopups = isPro || isBusiness

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Dine Credits</h3>
            <p className="text-sm text-gray-500">1 CV screening = 1 credit</p>
          </div>
        </div>
        
        {credits?.tier && (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">
            {credits.tier === 'pay_as_you_go' ? 'Pay as you go' : credits.tier}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Credits</p>
          <p className="text-3xl font-bold text-gray-900">{credits?.total || 0}</p>
        </div>
        
        {credits && credits.subscription > 0 && (
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 mb-1">Abonnement</p>
            <p className="text-3xl font-bold text-blue-900">{credits.subscription}</p>
            <p className="text-xs text-blue-600 mt-1">Nulstilles månedligt</p>
          </div>
        )}
        
        {credits && credits.purchased > 0 && (
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 mb-1">Tilkøbt</p>
            <p className="text-3xl font-bold text-green-900">{credits.purchased}</p>
            <p className="text-xs text-green-600 mt-1">Udløber aldrig</p>
          </div>
        )}
      </div>

      {canBuyTopups && (
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Tilkøb Ekstra Credits</h4>
            <Plus className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              onClick={() => handleTopup('boost_50')}
              disabled={!!loadingTopup}
              className="flex flex-col h-auto py-3"
            >
              <span className="font-bold text-lg">50</span>
              <span className="text-xs text-gray-600">99 kr</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleTopup('boost_100')}
              disabled={!!loadingTopup}
              className="flex flex-col h-auto py-3"
            >
              <span className="font-bold text-lg">100</span>
              <span className="text-xs text-gray-600">159 kr</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleTopup('boost_250')}
              disabled={!!loadingTopup}
              className="flex flex-col h-auto py-3"
            >
              <span className="font-bold text-lg">250</span>
              <span className="text-xs text-gray-600">199 kr</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleTopup('boost_500')}
              disabled={!!loadingTopup}
              className="flex flex-col h-auto py-3"
            >
              <span className="font-bold text-lg">500</span>
              <span className="text-xs text-gray-600">249 kr</span>
            </Button>
          </div>
        </div>
      )}

      {!canBuyTopups && credits?.tier === 'pay_as_you_go' && credits.total > 0 && (
        <div className="border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-600 mb-3">
            💡 Opgrader til Pro eller Business for at kunne tilkøbe ekstra credits
          </p>
          <Button asChild variant="default" className="w-full">
            <a href="/#pricing">Se Planer</a>
          </Button>
        </div>
      )}

      {(!credits || credits.total === 0 || !credits.tier) && (
        <div className="border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-600 mb-3">
            {credits && credits.total > 0 
              ? "Opgrader eller køb flere credits for at fortsætte!"
              : "Du har ingen credits endnu. Vælg en plan for at komme i gang!"
            }
          </p>
          <Button asChild variant="default" className="w-full">
            <a href="/#pricing">Køb Credits</a>
          </Button>
        </div>
      )}
    </div>
  )
}

