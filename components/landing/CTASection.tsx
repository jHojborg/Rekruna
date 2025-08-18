import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface CTASectionProps {
  onCtaClick?: () => void
}

export function CTASection({ onCtaClick }: CTASectionProps) {
  return (
    <section className="py-20 bg-brand-softGrey">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
        Effektivt og hurtig CV-screening!
        </h2>
        
        <p className="text-xl text-black mb-8 max-w-2xl mx-auto">
        Upload CV´r og stillingsopslag, lad systemet lave arbejdet, og du har en liste med de bedst egnede kandidater.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {onCtaClick ? (
            <Button size="lg" onClick={onCtaClick} className="text-lg px-8 py-4 h-auto font-semibold">
              Kom i gang i dag
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Button size="lg" asChild className="text-lg px-8 py-4 h-auto font-semibold">
              <Link href="/signup">
                Kom i gang i dag
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          )}
        
        </div>
        


        {/* Trust indicators */}
        <div className="mt-12 pt-8 border-t border-gray-300">
          <p className="text-black text-sm mb-4">
            Tillid til danske virksomheder
          </p>
          <div className="flex justify-center items-center gap-8">
            <div className="text-black font-semibold">GDPR Compliant</div>
            <div className="text-black font-semibold">🇩🇰 Dansk Support</div>
            <div className="text-black font-semibold">Hosting i EU</div>
          </div>
        </div>
      </div>
    </section>
  )
} 