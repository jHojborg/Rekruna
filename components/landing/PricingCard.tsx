import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PricingCardProps {
  title: string
  price: string
  features: string[]
  ctaText: string
  highlighted?: boolean
  onCtaClick?: () => void
}

export function PricingCard({ 
  title, 
  price, 
  features, 
  ctaText, 
  highlighted = false,
  onCtaClick 
}: PricingCardProps) {
  return (
    <div className={`bg-white rounded-xl p-8 shadow-sm ${
      highlighted ? 'border-2 border-primary-500 relative' : 'border border-gray-200'
    }`}>
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-primary-500 text-white px-4 py-2 rounded-full text-sm font-medium">
            Kampagnepris
          </span>
        </div>
      )}
      
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="text-gray-500 line-through text-xl">249 kr/måned</div>
          <div className="flex items-baseline justify-center">
            <span className="text-5xl font-bold text-gray-900">149</span>
            <span className="text-xl text-gray-600 ml-2">kr/måned</span>
          </div>
          <span className="text-sm bg-green-100 text-green-700 rounded-full px-3 py-1">Spar 100 kr./måned</span>
        </div>
      </div>
      
      <div className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            </div>
            <span className="ml-3 text-gray-700 font-medium">{feature}</span>
          </div>
        ))}
      </div>
      
      {onCtaClick ? (
        <Button onClick={onCtaClick} className="w-full py-4 text-lg font-semibold h-auto" variant={highlighted ? 'default' : 'outline'}>
          {ctaText}
        </Button>
      ) : (
        <Button asChild className="w-full py-4 text-lg font-semibold h-auto" variant={highlighted ? 'default' : 'outline'}>
          <Link href="/signup">{ctaText}</Link>
        </Button>
      )}

      
    </div>
  )
} 