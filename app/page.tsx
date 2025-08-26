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
          
          {(() => {
            const plans = [
              {
                title: "Rekruna Start",
                originalPrice: "249 kr/måned",
                finalPrice: "149",
                priceSuffix: "kr/måned",
                savingsText: "Spar 100 kr./måned",
                features: [
                  "Analyse af 1 stillingsopslag og 50 CV´r pr. måned.,
                  "Opsig når det passer",
                  "AI-drevet scorecard model",
                  "PDF rapporter med detaljeret begrundelse",
                  "GDPR compliant datasikkerhed",
                ],
                highlighted: false,
              },
              {
                title: "Rekruna One",
                originalPrice: "549 kr/måned",
                finalPrice: "349",
                priceSuffix: "kr/måned",
                savingsText: "Spar 200 kr./måned",
                features: [
                  "Op til 3 stillingsopslag og 300 CV´r pr. måned.",
                  "Opsig når det passer",
                  "AI-drevet scorecard model",
                  "PDF rapporter med detaljeret begrundelse",
                  "GDPR compliant datasikkerhed",
                ],
                highlighted: true,
              },
              {
                title: "Rekruna Pro",
                originalPrice:,
                finalPrice: "899",
                priceSuffix: "kr/måned",
                savingsText: "Spar 100 kr./måned",
                features: [
                  "Ubegrænset antal analyser",
                  "Opsig når det passer",
                  "AI-drevet scorecard model",
                  "PDF rapporter med detaljeret begrundelse",
                  "GDPR compliant datasikkerhed",
                ],
                highlighted: false,
              },
            ] as const

            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan, idx) => (
                  <PricingCard
                    key={idx}
                    title={plan.title}
                    originalPrice={plan.originalPrice}
                    finalPrice={plan.finalPrice}
                    priceSuffix={plan.priceSuffix}
                    savingsText={plan.savingsText}
                    features={plan.features}
                    ctaText="Start i dag"
                    highlighted={plan.highlighted}
                  />
                ))}
              </div>
            )
          })()}
          <p className="mt-6 text-center text-sm text-gray-500">*Tilbuddet gælder de først 50 nye kunder.<br>Alle priser eksl. 25% moms. Alle planer har en bindingsperiode på minimum 12 måneder.</br></p>
        </div>
      </section>

      <FAQAccordion />
      
      <CTASection />
    </main>
  )
} 