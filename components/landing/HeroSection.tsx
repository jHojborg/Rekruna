'use client'

import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'

interface HeroSectionProps {
  title: string
  subtitle: string
  ctaText: string
  onCtaClick?: () => void
}

export function HeroSection({ title, subtitle, ctaText, onCtaClick }: HeroSectionProps) {
  return (
    <section className="relative h-screen flex items-center">
      {/* Background image */}
      <Image
        src="/images/Hero-Temp-Image.jpeg"
        alt="Rekruna hero"
        fill
        priority
        className="absolute inset-0 -z-10 object-cover"
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 -z-10 bg-black/35" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-white">
            {title.split('80%').map((part, index) => (
              <span key={index}>
                {part}
                {index === 0 && (
                  <span className="text-primary-300">80%</span>
                )}
              </span>
            ))}
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 leading-relaxed text-white/90 max-w-2xl">
            {subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {onCtaClick ? (
              <Button size="lg" onClick={onCtaClick} className="text-lg px-8 py-4 h-auto">
                {ctaText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <Button size="lg" asChild className="text-lg px-8 py-4 h-auto">
                <Link href="/signup">
                  {ctaText}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            )}
          </div>
          
          <div className="mt-8 flex items-center gap-6 text-sm text-white/90">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Opsig når det passer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Hurtigste kandidatanalyse</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 