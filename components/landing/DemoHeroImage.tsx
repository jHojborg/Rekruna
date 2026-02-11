'use client'

/**
 * DemoHeroImage – Topbillede til demo-sider
 *
 * Bruger 50% højde af nuværende hero (hero er 100vh, så dette er 50vh).
 * Samme billede som forsiden, men kun halv højde.
 */
import Image from 'next/image'
import { DEMO_HERO_IMAGE, DEMO_HERO_IMAGE_ALT } from '@/lib/demo-content'

export function DemoHeroImage() {
  return (
    <section className="relative h-[50vh] min-h-[300px] w-full overflow-hidden bg-gray-900">
      <Image
        src={DEMO_HERO_IMAGE}
        alt={DEMO_HERO_IMAGE_ALT}
        fill
        priority
        className="object-cover object-center"
      />
      {/* Subtle dark overlay for readability if text is added later */}
      <div className="absolute inset-0 bg-black/20" />
    </section>
  )
}
