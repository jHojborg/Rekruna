"use client"
import { useEffect } from 'react'
import { Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
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
  
  // Handle hero CTA click - scroll to pricing section
  const handleHeroCta = () => {
    const pricingSection = document.getElementById('pricing')
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <main className="min-h-screen">
      <HeroSection 
        title="Screen ansøgere 90% hurtigere med AI"
        subtitle="- en mere objektiv og fair prioritering, der sikrer, at ingen ansøgere eller kompetencer bliver overset."
        ctaText="Start allerede i dag"
        onCtaClick={handleHeroCta}
        secondaryCtaText="Book en demo"
        secondaryCtaLink="/demo-signup"
      />
      
      <ProblemSolution />

      <TimeSavingsCalculator />

      <SolutionSection />
      
      <section id="pricing" className="py-25 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simpel og transparent prissætning
            </h2>
            {/* USPs with check icons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-xl text-gray-600">
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
                  <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
                <span>Engangsbetaling</span>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
                <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
                <span>Ingen opstartsfee</span>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
                <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
                <span>Kom i gang på under 1 minut</span>
              </div>
            </div>
          </div>
          
          {(() => {
            type Plan = {
              title: string
              originalPrice?: string
              finalPrice: string
              priceSuffix?: string
              savingsText?: string
              features: ReadonlyArray<string>
              highlighted: boolean
              tier: 'rekruna_1' | 'rekruna_5' | 'rekruna_10'
            }
            // Phase 3: Rekruna 1/5/10 - antal stillingsopslag, ubegrænsede CV'er
            const plans: Plan[] = [
              {
                title: "Rekruna 1",
                finalPrice: "2.495",
                priceSuffix: "kr.",
                features: [
                  "1 stillingsopslag",
                  "Ubegrænsede CV'er pr. opslag",
                  "Engangsbetaling",
                  "75 dage pr. rekrutteringsflow",
                ],
                highlighted: false,
                tier: 'rekruna_1',
              },
              {
                title: "Rekruna 5",
                finalPrice: "9.995",
                priceSuffix: "kr.",
                savingsText: "Spar 2.480 kr.",
                features: [
                  "5 stillingsopslag",
                  "Ubegrænsede CV'er pr. opslag",
                  "Engangsbetaling",
                  "75 dage pr. rekrutteringsflow",
                ],
                highlighted: true,
                tier: 'rekruna_5',
              },
              {
                title: "Rekruna 10",
                finalPrice: "17.995",
                priceSuffix: "kr.",
                savingsText: "Spar 4.955 kr.",
                features: [
                  "10 stillingsopslag",
                  "Ubegrænsede CV'er pr. opslag",
                  "Engangsbetaling",
                  "75 dage pr. rekrutteringsflow",
                ],
                highlighted: false,
                tier: 'rekruna_10',
              },
            ]

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
                    ctaHref="/signup"
                  />
                ))}
              </div>
            )
          })()}
          <p className="mt-6 text-center text-sm text-gray-500">Alle priser eksl. moms. Engangsbetaling. 75 dage pr. rekrutteringsflow.</p>
        </div>
      </section>

      {/* CTA section before FAQ - prompting users to book a demo */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            {/* Text on the left */}
            <p className="text-2xl font-semibold text-gray-900">
              Er du ikke helt overbevist endnu?
            </p>
            
            {/* Green CTA button on the right */}
            <Button 
              size="lg" 
              asChild 
              className="text-lg px-8 py-4 h-auto bg-[#B3D8A8] hover:bg-[#9fc794] text-gray-900"
            >
              <Link href="/demo-signup">
                Book en demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <FAQAccordion />
      
      <CTASection />
    </main>
  )
} 