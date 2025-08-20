"use client"

import { useEffect } from 'react'

// Global client-side router that detects Supabase recovery links
// arriving with tokens in the URL hash and forwards to the
// dedicated reset-password page. This runs on every route.
export function HashRecoveryRouter() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash || ''
    if (hash.includes('type=recovery')) {
      window.location.replace(`/reset-password${hash}`)
    }
  }, [])

  return null
}


