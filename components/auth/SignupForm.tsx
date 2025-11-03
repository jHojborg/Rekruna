"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface SignupFormProps {
  onSubmit?: (data: any) => void
  isLoading?: boolean
  plan?: 'pay_as_you_go' | 'pro' | 'business'
  price?: number
  credits?: number
}

const passwordOk = (pwd: string) => /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd) && pwd.length >= 8

export function SignupForm({ 
  onSubmit, 
  isLoading = false, 
  plan = 'pro',
  price = 349,
  credits = 400
}: SignupFormProps) {
  const [form, setForm] = useState({
    companyName: '',
    address: '',
    postalCode: '',
    city: '',
    cvr: '',
    name: '',
    email: '',
    password: '',
    marketing_consent: false,
    accept: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const setField = (k: string, v: string | boolean) => setForm((s) => ({ ...s, [k]: v }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.companyName) e.companyName = 'Firmanavn er påkrævet'
    if (!form.address) e.address = 'Adresse er påkrævet'
    if (!form.postalCode) e.postalCode = 'Postnummer er påkrævet'
    if (!form.city) e.city = 'By er påkrævet'
    if (!form.cvr) e.cvr = 'CVR er påkrævet'
    if (!form.name) e.name = 'Navn er påkrævet'
    if (!form.email) e.email = 'Email er påkrævet'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Ugyldig email'
    
    // More detailed password validation
    if (!form.password || form.password.length < 8) {
      e.password = 'Kodeord skal være mindst 8 tegn'
    } else if (!/[A-Z]/.test(form.password)) {
      e.password = 'Kodeord mangler store bogstaver (A-Z)'
    } else if (!/[a-z]/.test(form.password)) {
      e.password = 'Kodeord mangler små bogstaver (a-z)'
    } else if (!/[^A-Za-z0-9]/.test(form.password)) {
      e.password = 'Kodeord mangler specialtegn (f.eks. !@#$%^&*)'
    }
    
    if (!form.accept) e.accept = 'Husk at acceptere vores handelsbetingelser'
    setErrors(e)
    return Object.keys(e).length === 0
  }
  
  // Plan configuration for display
  const planNames = {
    pay_as_you_go: 'One',
    pro: 'Pro',
    business: 'Business'
  }
  
  const planTypes = {
    pay_as_you_go: 'one_time',
    pro: 'subscription',
    business: 'subscription'
  }
  
  const planName = planNames[plan]
  const isSubscription = planTypes[plan] === 'subscription'
  
  // Calculate VAT (Danish moms = 25%)
  const VAT_RATE = 0.25
  const priceExVat = price
  const vatAmount = Math.round(priceExVat * VAT_RATE * 100) / 100
  const totalInclVat = Math.round((priceExVat + vatAmount) * 100) / 100

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Run validation and show errors if any
    const isValid = validate()
    
    if (!isValid) {
      // Small delay to let error state update, then scroll to first error
      setTimeout(() => {
        const firstErrorElement = document.querySelector('.text-red-600') as HTMLElement
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
      return
    }
    
    onSubmit?.(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Kontooplysninger */}
        <Card>
          <CardHeader>
            <CardTitle>Kontooplysninger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label htmlFor="companyName">Firmanavn</Label>
              <Input id="companyName" value={form.companyName} onChange={(e) => setField('companyName', e.target.value)} placeholder="Dit firmanavn" />
              {errors.companyName && <p className="text-sm text-red-600 mt-1">{errors.companyName}</p>}
            </div>
            <div>
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" value={form.address} onChange={(e) => setField('address', e.target.value)} placeholder="Firmaadresse" />
              {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postalCode">Postnummer</Label>
                <Input id="postalCode" value={form.postalCode} onChange={(e) => setField('postalCode', e.target.value)} placeholder="0000" />
                {errors.postalCode && <p className="text-sm text-red-600 mt-1">{errors.postalCode}</p>}
              </div>
              <div>
                <Label htmlFor="city">By</Label>
                <Input id="city" value={form.city} onChange={(e) => setField('city', e.target.value)} placeholder="By" />
                {errors.city && <p className="text-sm text-red-600 mt-1">{errors.city}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="cvr">CVR nr.</Label>
              <Input id="cvr" value={form.cvr} onChange={(e) => setField('cvr', e.target.value)} placeholder="12345678" />
              {errors.cvr && <p className="text-sm text-red-600 mt-1">{errors.cvr}</p>}
            </div>
            <div>
              <Label htmlFor="name">Fulde navn</Label>
              <div className="relative mt-1">
                <Input id="name" value={form.name} onChange={(e) => setField('name', e.target.value)} className="pl-10" placeholder="Dit fulde navn" />
                <User className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
              </div>
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email adresse</Label>
              <div className="relative mt-1">
                <Input id="email" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} className="pl-10" placeholder="din@email.dk" />
                <Mail className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
              </div>
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="password">Kodeord</Label>
              <div className="relative mt-1">
                <Input id="password" type="password" value={form.password} onChange={(e) => setField('password', e.target.value)} className="pl-10" placeholder="Min. 8 tegn, store+små + specialtegn" />
                <Lock className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
              </div>
              {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
            </div>
            
            {/* Marketing Consent */}
            <div className="flex items-start gap-2 pt-2">
              <input 
                id="marketing" 
                type="checkbox" 
                className="mt-1 h-4 w-4 rounded border-gray-300" 
                checked={form.marketing_consent} 
                onChange={(e) => setField('marketing_consent', e.target.checked)} 
              />
              <Label htmlFor="marketing" className="text-gray-700">
                Ja tak til relevante opdateringer og nyheder fra Rekruna
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Plan Display */}
          <Card className="relative">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-gray-900">Rekruna {planName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 border-2 rounded-lg border-primary">
                <div className="grid grid-cols-2 gap-y-3 items-baseline">
                  <p className="text-gray-600 font-bold">
                    {isSubscription 
                      ? `Pris pr. måned incl. ${credits} CVer:` 
                      : `Pris incl. ${credits} CVer:`
                    }
                  </p>
                  <p className="text-right text-2xl font-bold text-gray-900">{priceExVat} kr.</p>
                  
                  <p className="text-gray-600">Moms:</p>
                  <p className="text-right text-gray-900">{vatAmount.toFixed(2)} kr.</p>
                  
                  <p className="text-gray-900">
                    {isSubscription ? 'Månedlige pris incl. moms:' : 'Total incl. moms:'}
                  </p>
                  <p className="text-right text-gray-900">{totalInclVat.toFixed(2)} kr.</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4 text-center">
                {isSubscription 
                  ? 'Fortløbende abonnementet indtil det opsiges. Opsigelsesfrist: Ibn mdr + 30 dage.'
                  : 'Engangsbetaling. Ingen abonnement.'
                }
              </p>
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-2">
                <input 
                  id="accept" 
                  required 
                  type="checkbox" 
                  className="mt-1 h-4 w-4 rounded border-gray-300" 
                  checked={form.accept} 
                  onChange={(e) => setField('accept', e.target.checked)} 
                />
                <Label htmlFor="accept" className="text-gray-700">
                  Jeg bekræfter at have læst og accepterer Rekruna{' '}
                  <Link href="/handelsbetingelser" className="text-primary underline underline-offset-2">
                    handelsbetingelser
                  </Link>
                </Label>
              </div>
              {errors.accept && <p className="text-sm text-red-600 mt-2">{errors.accept}</p>}
              
              {/* Button moved here - max 25% width, centered */}
              <div className="flex flex-col items-center">
                <Button type="submit" disabled={isLoading} className="px-8 py-3 text-base font-semibold" style={{ maxWidth: '25%', minWidth: '200px' }}>
                  {isLoading ? 'Behandler...' : 'Til betaling'}
                </Button>
                <p className="text-sm text-gray-600 text-center mt-2">
                  Åbner ny vindue hos Stripe, vores betalingspartner
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
