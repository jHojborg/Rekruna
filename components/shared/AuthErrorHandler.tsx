"use client"

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

/**
 * Fanger "Invalid Refresh Token" fejl globalt.
 * Når Supabase har en ugyldig/udløbet refresh token i localStorage,
 * kan den kaste AuthApiError. Vi rydder sessionen for at undgå gentagen fejl.
 */
export function AuthErrorHandler() {
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event?.reason
      const msg = (reason?.message ?? reason?.error_description ?? String(reason ?? '')).toLowerCase()
      if (msg.includes('refresh token') || msg.includes('refresh_token')) {
        event.preventDefault()
        supabase.auth.signOut()
        // Reload så siden viser logget-ud tilstand
        window.location.reload()
      }
    }
    window.addEventListener('unhandledrejection', handleRejection)
    return () => window.removeEventListener('unhandledrejection', handleRejection)
  }, [])
  return null
}
