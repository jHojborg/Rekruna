"use client"

// Reset password page
// This page is the landing destination when a user clicks the Supabase
// "Reset password" email link. Supabase sends users to the Site URL with
// access_token/refresh_token in the URL hash and type=recovery.
// We:
// 1) Parse tokens from window.location.hash
// 2) Establish a session via supabase.auth.setSession so the user is authenticated
// 3) Let the user choose a new password and submit with supabase.auth.updateUser
// 4) On success, guide the user to log in or go to dashboard

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Phase = 'initializing' | 'ready' | 'updating' | 'success' | 'error'

// Simple helper to parse the URL hash fragment (after #) into a key/value map
function parseHashParams(hash: string): Record<string, string> {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  const params = new URLSearchParams(raw)
  const out: Record<string, string> = {}
  params.forEach((v, k) => {
    out[k] = v
  })
  return out
}

const passwordOk = (pwd: string) => /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd) && pwd.length >= 8

export default function ResetPasswordPage() {
  const [phase, setPhase] = useState<Phase>('initializing')
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  // Parse tokens from the hash on first render
  const tokens = useMemo(() => {
    if (typeof window === 'undefined') return null
    if (!window.location.hash) return null
    const p = parseHashParams(window.location.hash)
    if (!p.access_token || !p.refresh_token || p.type !== 'recovery') return null
    return { access_token: p.access_token, refresh_token: p.refresh_token }
  }, [])

  useEffect(() => {
    // Establish a session from the recovery tokens. This authenticates the user
    // so that updateUser({ password }) is allowed.
    const init = async () => {
      if (!tokens) {
        setPhase('error')
        setError('Ugyldigt eller udløbet gendannelseslink. Anmod om en ny mail.')
        return
      }
      const { error } = await supabase.auth.setSession(tokens)
      if (error) {
        setPhase('error')
        setError(error.message)
        return
      }
      setPhase('ready')
    }
    init()
    // We intentionally only run once on mount with the parsed tokens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!passwordOk(password)) {
      setError('Kodeord skal have min. 8 tegn, store+små bogstaver og specialtegn.')
      return
    }
    if (password !== confirm) {
      setError('Kodeord matcher ikke gentagelsen.')
      return
    }

    setPhase('updating')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setPhase('error')
      setError(error.message)
      return
    }
    setPhase('success')
  }

  return (
    <main className="min-h-screen bg-brand-base py-16 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">Ny adgangskode</CardTitle>
          </CardHeader>
          <CardContent>
            {phase === 'initializing' && (
              <p className="text-gray-700">Validerer gendannelseslink…</p>
            )}

            {(phase === 'ready' || phase === 'updating') && (
              <form onSubmit={onSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="password">Nyt kodeord</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 tegn, store+små + specialtegn"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm">Gentag kodeord</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Gentag dit nye kodeord"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <Button type="submit" disabled={phase === 'updating'} className="w-full">
                  {phase === 'updating' ? 'Opdaterer…' : 'Opdater kodeord'}
                </Button>
              </form>
            )}

            {phase === 'success' && (
              <div className="space-y-4">
                <p className="text-gray-700">Din adgangskode er opdateret.</p>
                {/* Efter sikkerhedspraksis bør bruger logge ind på ny */}
                <Link href="/login">
                  <Button>Gå til login</Button>
                </Link>
              </div>
            )}

            {phase === 'error' && (
              <div className="space-y-4">
                <p className="text-red-700">{error}</p>
                <Link href="/login">
                  <Button>Tilbage til login</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}


