'use client'

/**
 * TrackCompleteRegistration – Sender Meta Pixel CompleteRegistration event
 *
 * Bruges kun på /demo-booked. Kører én gang ved mount og sender
 * CompleteRegistration med content_name "Demo Booked" til Meta Pixel.
 */
import { useEffect } from 'react'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

export default function TrackCompleteRegistration() {
  useEffect(() => {
    if (!window.fbq) return
    window.fbq('track', 'CompleteRegistration', { content_name: 'Demo Booked' })
  }, [])

  return null
}
