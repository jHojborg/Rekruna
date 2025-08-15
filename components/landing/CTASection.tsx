import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface CTASectionProps {
  onCtaClick?: () => void
}

export function CTASection({ onCtaClick }: CTASectionProps) {
  return (
    <section className="py-20 bg-primary-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
        Effektivt og hurtig proces til moderne rekruttering!
        </h2>
        
        <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
        Alt hvad du har brug for til effektivt at screene kandidater og opnå bedre beslutningsgrundlag til den videre proces.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {onCtaClick ? (
            <Button size="lg" onClick={onCtaClick} className="bg-white text-primary-600 hover:bg-gray-50 text-lg px-8 py-4 h-auto font-semibold">
              Kom i gang i dag
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Button size="lg" asChild className="bg-white text-primary-600 hover:bg-gray-50 text-lg px-8 py-4 h-auto font-semibold">
              <Link href="/signup">
                Kom i gang i dag
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          )}
        
        </div>
        


        {/* Trust indicators */}
        <div className="mt-12 pt-8 border-t border-primary-500">
          <p className="text-primary-200 text-sm mb-4">
            Tillid til danske virksomheder
          </p>
          <div className="flex justify-center items-center gap-8 opacity-60">
            <div className="text-primary-200 font-semibold">GDPR Compliant</div>
            <div className="text-primary-200 font-semibold">🇩🇰 Dansk Support</div>
            <div className="text-primary-200 font-semibold">Hosting i EU</div>
          </div>
        </div>
      </div>
    </section>
  )
} 