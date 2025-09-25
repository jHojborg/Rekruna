import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface CTASectionProps {
  onCtaClick?: () => void
}

export function CTASection({ onCtaClick }: CTASectionProps) {
  return (
    <section className="py-25 bg-brand-base">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Er du klar til Rekruna?
          </h2>
          <p className="text-xl text-gray-600">
          Effektiv screening og priotitering af alle kandidater.<br />Frigøre din tid til samtaler med de bedste kandidater.<br />Start nu og vær i gang om under ét minut. 
          </p>
        </div>  
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {onCtaClick ? (
            <Button size="lg" onClick={onCtaClick} className="text-lg px-8 py-4 h-auto font-semibold">
              Kom i gang i 
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Button size="lg" asChild className="text-lg px-8 py-4 h-auto font-semibold">
              <Link href="/signup">
                Start allerede i dag
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          )}
        
        </div>
        


        {/* Trust indicators
        <div className="mt-12 pt-8 border-t border-gray-300">
          <div className="flex justify-center items-center gap-8">
            <div className="text-black font-semibold">GDPR Compliant</div>
            <div className="text-black font-semibold">Udviklet i Danmark</div>
            <div className="text-black font-semibold">Hosting i EU</div>
          </div>
        </div>
        */}
      </div>
    </section>
  )
} 