/**
 * Demo landing page – rekruna.dk/demo
 *
 * Indhold: hero-bjælke + video + ProblemSolution + tekstfelt + kontaktform
 * Ikke indekseret i søgemaskiner eller generativ AI.
 * Rediger indhold i lib/demo-content.ts
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { DemoHeroImage } from '@/components/landing/DemoHeroImage'
import { Button } from '@/components/ui/button'
import { DemoVideoSection } from '@/components/landing/DemoVideoSection'
import { ProblemSolution } from '@/components/landing/ProblemSolution'
import { DemoContactForm } from '@/components/landing/DemoContactForm'
import { DEMO_VIDEO_CTA_TEXT_LINE1, DEMO_VIDEO_CTA_TEXT_LINE2, DEMO_VIDEO_CTA_TEXT_LINE3 } from '@/lib/demo-content'

export const metadata: Metadata = {
  title: 'Rekruna CV screening med AI',
  description: 'Se demo video',
  // Bloker indeksering i søgemaskiner og generativ AI
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: 'noindex, nofollow'
  }
}

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-white">
      <DemoHeroImage />

      <DemoVideoSection />

      <ProblemSolution />

      {/* Tekstfelt "Se hele demovideo.." + kontaktform. pt-10: top-padding halveret (fra 5rem til 2.5rem) for at reducere afstand til ProblemSolution med 50% */}
      <section className="pt-10 pb-20 bg-brand-softGrey">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <p className="text-xl text-gray-700 text-center mb-10">
              {DEMO_VIDEO_CTA_TEXT_LINE1}
              <br />
              {DEMO_VIDEO_CTA_TEXT_LINE2}
              <br />
              {DEMO_VIDEO_CTA_TEXT_LINE3}
            </p>
            <DemoContactForm />

            {/* Knap til forsiden – 75% bredde, grå farve, centreret */}
            <div className="mt-8 flex justify-center">
              <Button asChild className="w-3/4 py-6 text-lg bg-gray-500 text-white hover:bg-gray-600">
                <Link href="/">Læs mere om Rekruna her .</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
