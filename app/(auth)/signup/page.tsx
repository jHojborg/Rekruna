'use client'

import { useState, Suspense } from 'react'
import { SignupForm } from '@/components/auth/SignupForm'
import { supabase } from '@/lib/supabase/client'

// Phase 2: Signup without payment - profile only. User pays when they first use the system.
function SignupContent() {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async (data: any) => {
    setIsLoading(true)
    
    try {
      // 1. Create Supabase auth user
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
      
      const token = authData.session?.access_token
      
      if (!token) {
        console.error('No session token received.')
        alert('Der blev oprettet en bruger, men systemet kræver email-bekræftelse. Kontakt support@rekruna.dk')
        setIsLoading(false)
        return
      }
      
      // 2. Create user profile (no payment - Phase 2)
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
      
      // 3. Redirect to dashboard (no Stripe checkout - user pays when they first use)
      window.location.href = '/dashboard'
      
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
          <h1 className="text-4xl font-bold text-gray-900">Opret din Rekruna konto</h1>
          <p className="text-gray-600 mt-2">
            Udfyld dine oplysninger og kom i gang. Du betaler først når du køber en pakke.
          </p>
        </div>
        <SignupForm 
          onSubmit={handleSubmit} 
          isLoading={isLoading}
          plan="pro"
          price={0}
          credits={0}
          deferPayment
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
