'use client'

/**
 * MetaPixelRouteTracker – Korrekt PageView tracking ved client-side routing
 *
 * Ved navigation via <Link> sker der ingen fuld sideindlæsning, så Meta Pixel
 * får kun PageView ved første load. Denne komponent lytter på route-ændringer
 * (pathname, searchParams) og sender PageView hver gang brugeren navigerer.
 */
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

export function MetaPixelRouteTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!window.fbq) return
    window.fbq('track', 'PageView')
  }, [pathname, searchParams])

  return null
}
