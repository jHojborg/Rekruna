'use client'

/**
 * DemoHeroBar – Bjælke øverst på demo-siden (som på Kontakt-siden)
 *
 * Erstatter det store hero-billede med en let bjælke med headline og undertekst.
 * Rediger DEMO_HERO_HEADLINE_LINE1, LINE2 og DEMO_HERO_SUBHEADLINE i lib/demo-content.ts.
 * pb-5 reducerer afstanden til video-sektionen (yderligere 50% mindre end oprindeligt).
 */
import { DEMO_HERO_HEADLINE_LINE1, DEMO_HERO_HEADLINE_LINE2, DEMO_HERO_HEADLINE_LINE3, DEMO_HERO_SUBHEADLINE, DEMO_HERO_SUBHEADLINE_LINE2 } from '@/lib/demo-content'

export function DemoHeroImage() {
  return (
    <section className="pt-20 pb-5 bg-brand-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 leading-tight mb-4">
            {DEMO_HERO_HEADLINE_LINE1}
          </h1>
          {/* LINE2 + LINE3: samme stil som ProblemSolution-paragrafen (text-xl, regular, gray-700) */}
          <p className="text-xl text-gray-700 font-normal">
            {DEMO_HERO_HEADLINE_LINE2}
          </p>
          <p className="text-xl text-gray-700 font-normal">
            {DEMO_HERO_HEADLINE_LINE3}
          </p>
          {/* Subheadlines: samme linjeafstand mellem dem som mellem LINE2 og LINE3 (én paragraf med <br />) */}
          <p className="text-xl text-gray-700 font-normal mt-4">
            {DEMO_HERO_SUBHEADLINE}
            <br />
            {DEMO_HERO_SUBHEADLINE_LINE2}
          </p>
        </div>
      </div>
    </section>
  )
}
