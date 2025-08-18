import { HeroSection } from '@/components/landing/HeroSection'
import { ProblemSolution } from '@/components/landing/ProblemSolution'
import { TimeSavingsCalculator } from '@/components/landing/TimeSavingsCalculator'
import { FeaturesGrid } from '@/components/landing/FeaturesGrid'
import { PricingCard } from '@/components/landing/PricingCard'
import { FAQAccordion } from '@/components/landing/FAQAccordion'
import { CTASection } from '@/components/landing/CTASection'

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <HeroSection 
        title="Screen job-kandidater 80% hurtigere med AI"
        subtitle="Få en prioriteret kandidatliste på få minutter og se straks, hvem der bedst matcher jobbet"
        ctaText="Start allerede i dag"
      />
      
      <ProblemSolution />

      <TimeSavingsCalculator />
      
      <FeaturesGrid />
      
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
          
          <div className="max-w-md mx-auto">
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
          </div>
        </div>
      </section>

      <FAQAccordion />
      
      <CTASection />
    </main>
  )
} 