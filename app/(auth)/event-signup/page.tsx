'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EventSignupForm } from '@/components/auth/EventSignupForm'
import toast from 'react-hot-toast'

// =====================================================
// EVENT SIGNUP PAGE
// Landingsside for EVENT demo tilmeldinger
// Bruges til marketing kampagner
// =====================================================

export default function EventSignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  // =====================================================
  // SUBMIT HANDLER
  // =====================================================
  
  const handleSubmit = async (data: any) => {
    setIsLoading(true)
    
    try {
      // Send signup request til backend
      const response = await fetch('/api/event-signup/pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: data.companyName,
          name: data.name,
          phone: data.phone,
          email: data.email,
          password: data.password,
          // Optional: Add campaign tracking if available in URL params
          campaignSource: new URLSearchParams(window.location.search).get('campaign') || undefined,
          utm: {
            source: new URLSearchParams(window.location.search).get('utm_source') || undefined,
            medium: new URLSearchParams(window.location.search).get('utm_medium') || undefined,
            campaign: new URLSearchParams(window.location.search).get('utm_campaign') || undefined,
          }
        }),
      })
      
      const result = await response.json()
      
      if (!result.success) {
        // Show error message
        toast.error(result.error || 'Der opstod en fejl. Prøv igen.')
        setIsLoading(false)
        return
      }
      
      // Success! Redirect to pending/success page
      toast.success('Din anmodning er modtaget!')
      router.push('/event-signup/pending')
      
    } catch (error) {
      console.error('Event signup error:', error)
      toast.error('Der opstod en fejl. Prøv igen.')
      setIsLoading(false)
    }
  }
  
  // =====================================================
  // RENDER
  // =====================================================

  return (
    <main className="min-h-screen bg-brand-base py-16 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Headline og brødtekst */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Velkommen til Rekruna demo
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto">
            For at få adgang til demo skal du udfylde formularen nedenfor. 
            Vi behandler din anmodning og kontakter dig snarest.
          </p>
          
          {/* Demo features highlight */}
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              <span>14 dages gratis adgang</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              <span>100 credits inkluderet</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              <span>Fuld funktionalitet</span>
            </div>
          </div>
        </div>
        
        {/* Signup formular */}
        <EventSignupForm 
          onSubmit={handleSubmit} 
          isLoading={isLoading}
        />
        
        {/* Footer info */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Har du allerede en konto?{' '}
            <a href="/login" className="text-primary underline hover:text-primary/80">
              Log ind her
            </a>
          </p>
        </div>
        
      </div>
    </main>
  )
}

