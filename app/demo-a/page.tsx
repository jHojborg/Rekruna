/**
 * Demo-A landing page
 *
 * Indhold: topbillede (50% hero) + video + ProblemSolution + tekstfelt + kontaktform
 * Ikke indekseret i søgemaskiner eller generativ AI.
 * Rediger indhold i lib/demo-content.ts
 */
import type { Metadata } from 'next'
import { DemoHeroImage } from '@/components/landing/DemoHeroImage'
import { DemoVideoSection } from '@/components/landing/DemoVideoSection'
import { ProblemSolution } from '@/components/landing/ProblemSolution'
import { DemoContactForm } from '@/components/landing/DemoContactForm'
import { DEMO_VIDEO_CTA_TEXT } from '@/lib/demo-content'

export const metadata: Metadata = {
  title: 'Demo A - Rekruna',
  description: 'Se Rekruna demo',
  // Bloker indeksering i søgemaskiner og generativ AI
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: 'noindex, nofollow'
  }
}

export default function DemoAPage() {
  return (
    <main className="min-h-screen bg-white">
      <DemoHeroImage />

      <DemoVideoSection />

      <ProblemSolution />

      {/* Tekstfelt "Se hele demovideo.." + kontaktform */}
      <section className="py-20 bg-brand-softGrey">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <p className="text-xl text-gray-700 text-center mb-10">
              {DEMO_VIDEO_CTA_TEXT}
            </p>
            <DemoContactForm />
          </div>
        </div>
      </section>
    </main>
  )
}
