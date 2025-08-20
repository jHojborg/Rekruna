"use client"

// Simple page to request a password reset email
// User enters email, we trigger Supabase to send reset link which
// redirects back to our /reset-password page when clicked.

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Indtast en gyldig email.')
      return
    }
    setLoading(true)
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const redirectTo = `${origin}/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (error) setError(error.message)
      else setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-brand-base py-16 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">Glemt adgangskode</CardTitle>
          </CardHeader>
          <CardContent>
            {sent ? (
              <p className="text-gray-700">Vi har sendt en mail med et link til at nulstille din adgangskode.</p>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="din@email.dk" />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Sender…' : 'Send reset-mail'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}


