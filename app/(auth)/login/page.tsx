"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Mail, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e: typeof errors = {}
    if (!form.email) e.email = 'Email er påkrævet'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Ugyldig email'
    if (!form.password) e.password = 'Adgangskode er påkrævet'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
      if (error) setErrors({ general: error.message })
      else window.location.href = '/dashboard'
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md relative">
        <Link href="/" className="absolute right-3 top-3 text-gray-500 hover:text-gray-700">
          <X className="h-5 w-5" />
        </Link>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Log ind</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="pl-10" placeholder="din@email.dk" />
                <Mail className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
              </div>
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="password">Adgangskode</Label>
              <div className="relative mt-1">
                <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="pl-10" placeholder="Din adgangskode" />
                <Lock className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
              </div>
              {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
            </div>

            {errors.general && <p className="text-sm text-red-600">{errors.general}</p>}

            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Logger ind...' : 'Log ind'}</Button>
            <div className="mt-3 flex items-center justify-between">
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">Glemt adgangskode?</Link>
              <Link href="/signup" className="text-sm text-primary hover:underline">Ingen konto endnu? Opret dig her</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
