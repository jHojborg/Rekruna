'use client'

import { SignupForm } from '@/components/auth/SignupForm'
import { PricingCard } from '@/components/landing/PricingCard'
import { supabase } from '@/lib/supabase/client'

export default function SignupPage() {
  const handleSubmit = async (data: any) => {
    const { email, password, name, companyName } = data
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, companyName } },
    })
    if (error) {
      alert(error.message)
      return
    }
    window.location.href = '/dashboard'
  }

  return (
    <main className="min-h-screen bg-brand-base py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900">Kom i gang med Rekruna</h1>
          <p className="text-gray-600 mt-2">Opret en konto og start din 14 dages gratis prøveperiode</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <SignupForm onSubmit={handleSubmit} />
          <div className="self-start">
            <PricingCard
              title="Rekruna One"
              price="149 kr/måned"
              ctaText="Kom i gang i dag"
              highlighted
              features={[
                'Ubegrænset antal analyser',
                'Opsig når det passer - dog min. 1 måned',
                'AI-drevet scorecard model',
                'PDF rapporter med detaljeret begrundelse',
                'GDPR compliant datasikkerhed',
              ]}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
