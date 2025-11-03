'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { SignupForm } from '@/components/auth/SignupForm'
import { supabase } from '@/lib/supabase/client'

// Component that uses useSearchParams (must be wrapped in Suspense)
function SignupContent() {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  
  // Parse URL parameters for plan selection
  const plan = (searchParams.get('plan') || 'pro') as 'pay_as_you_go' | 'pro' | 'business'
  const price = parseInt(searchParams.get('price') || '349')
  const credits = parseInt(searchParams.get('credits') || '400')
  
  // Plan configuration
  const planConfig = {
    pay_as_you_go: { tier: 'pay_as_you_go', name: 'One' },
    pro: { tier: 'pro', name: 'Pro' },
    business: { tier: 'business', name: 'Business' }
  }
  
  const selectedPlan = planConfig[plan]
  
  const handleSubmit = async (data: any) => {
    setIsLoading(true)
    
    try {
      // 1. Create Supabase auth user
      // emailRedirectTo prevents email confirmation requirement
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            name: data.name,
            company_name: data.companyName
          }
        }
      })
      
      if (signupError) {
        console.error('Signup error:', signupError)
        alert(`Signup fejl: ${signupError.message}`)
        setIsLoading(false)
        return
      }
      
      if (!authData.user) {
        alert('Kunne ikke oprette bruger. Prøv igen.')
        setIsLoading(false)
        return
      }
      
      // Debug logging to understand what we got from signUp
      console.log('Auth data from signUp:', {
        hasUser: !!authData.user,
        hasSession: !!authData.session,
        userEmail: authData.user?.email
      })
      
      // Use the session that was returned directly from signUp
      // This is more reliable than calling getSession() again
      const token = authData.session?.access_token
      
      if (!token) {
        // If no session, check if email confirmation is required
        console.error('No session token received. This likely means email confirmation is required.')
        alert('Der blev oprettet en bruger, men systemet kræver email-bekræftelse. Kontakt support@rekruna.dk')
        setIsLoading(false)
        return
      }
      
      // 2. Create user profile
      const profileResponse = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          company_name: data.companyName,
          contact_person: data.name,
          cvr_number: data.cvr,
          address: data.address,
          postal_code: data.postalCode,
          city: data.city,
          email: data.email,
          marketing_consent: data.marketing_consent
        })
      })
      
      if (!profileResponse.ok) {
        const errorData = await profileResponse.json()
        alert(`Profil fejl: ${errorData.error || 'Ukendt fejl'}`)
        setIsLoading(false)
        return
      }
      
      // 3. Create Stripe checkout session
      const checkoutResponse = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tier: selectedPlan.tier
        })
      })
      
      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json()
        alert(`Checkout fejl: ${errorData.error || 'Ukendt fejl'}`)
        setIsLoading(false)
        return
      }
      
      const { url } = await checkoutResponse.json()
      
      // 4. Redirect to Stripe Checkout
      window.location.href = url
      
    } catch (error: any) {
      console.error('Signup error:', error)
      alert(`Fejl: ${error.message || 'Ukendt fejl'}`)
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-brand-base py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900">Kom i gang med Rekruna</h1>
          <p className="text-gray-600 mt-2">
            Udfyld dine oplysninger og fortsæt til sikker betaling
          </p>
        </div>
        <SignupForm 
          onSubmit={handleSubmit} 
          isLoading={isLoading}
          plan={plan}
          price={price}
          credits={credits}
        />
      </div>
    </main>
  )
}

// Main page component with Suspense boundary (required by Next.js 15 for useSearchParams)
export default function SignupPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-brand-base py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600">Indlæser...</p>
        </div>
      </main>
    }>
      <SignupContent />
    </Suspense>
  )
}
