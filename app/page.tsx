"use client"
import { useEffect } from 'react'
import { HeroSection } from '@/components/landing/HeroSection'
import { ProblemSolution } from '@/components/landing/ProblemSolution'
import { TimeSavingsCalculator } from '@/components/landing/TimeSavingsCalculator'
import { SolutionSection } from '@/components/landing/SolutionSection'
import { PricingCard } from '@/components/landing/PricingCard'
import { FAQAccordion } from '@/components/landing/FAQAccordion'
import { CTASection } from '@/components/landing/CTASection'

export default function LandingPage() {
  // Handle Supabase password recovery links coming to the Site URL root.
  // Supabase sends tokens in the URL hash (after #), which the server cannot read.
  // We detect `type=recovery` on the client and forward the user to
  // `/reset-password` while preserving the entire hash (tokens/timeouts).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash || ''
    if (hash.includes('type=recovery')) {
      window.location.replace(`/reset-password${hash}`)
    }
  }, [])

  return (
    <main className="min-h-screen">
      <HeroSection 
        title="Screen job-kandidater 80% hurtigere med AI"
        subtitle="Få en prioriteret kandidatliste på få minutter og se straks, hvem der bedst matcher jobbet"
        ctaText="Start allerede i dag"
      />
      
      <ProblemSolution />

      <TimeSavingsCalculator />

      <SolutionSection />
      
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simpel og transparent prissætning
            </h2>
            <p className="text-xl text-gray-600">
            Alt hvad du har brug for til effektivt at screene og priotitere kandidater.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingCard
              title="Rekruna Start"
              price="199 kr/måned"
              features={[
                "Ubegrænset antal analyser",
                "Opsig når det passer",
                "AI-drevet scorecard model",
                "PDF rapporter med detaljeret begrundelse",
                "GDPR compliant datasikkerhed"
              ]}
              ctaText="Kom i gang i dag"
              highlighted={false}
            />
            <PricingCard
              title="Rekruna One"
              price="249 kr/måned"
              features={[
                "Ubegrænset antal analyser",
                "Opsig når det passer",
                "AI-drevet scorecard model",
                "PDF rapporter med detaljeret begrundelse",
                "GDPR compliant datasikkerhed"
              ]}
              ctaText="Kom i gang i dag"
              highlighted={true}
            />
            <PricingCard
              title="Rekruna Pro"
              price="399 kr/måned"
              features={[
                "Ubegrænset antal analyser",
                "Opsig når det passer",
                "AI-drevet scorecard model",
                "PDF rapporter med detaljeret begrundelse",
                "GDPR compliant datasikkerhed"
              ]}
              ctaText="Kom i gang i dag"
              highlighted={false}
            />
          </div>
          <p className="mt-6 text-center text-sm text-gray-500">*Tilbuddet gælder de først 50 nye kunder</p>
        </div>
      </section>

      <FAQAccordion />
      
      <CTASection />
    </main>
  )
} 