"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, User, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface SignupFormProps {
  onSubmit?: (data: any) => void
  isLoading?: boolean
}

const passwordOk = (pwd: string) => /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd) && pwd.length >= 8

export function SignupForm({ onSubmit, isLoading = false }: SignupFormProps) {
  const [form, setForm] = useState({
    companyName: '',
    address: '',
    postalCode: '',
    city: '',
    cvr: '',
    name: '',
    email: '',
    password: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardName: '',
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
    if (!passwordOk(form.password)) e.password = 'Min. 8 tegn, store+små bogstaver og specialtegn'
    if (!form.cardNumber) e.cardNumber = 'Kortnummer er påkrævet'
    if (!form.expiry) e.expiry = 'Udløb er påkrævet'
    if (!form.cvv) e.cvv = 'CVV er påkrævet'
    if (!form.cardName) e.cardName = 'Navn på kort er påkrævet'
    if (!form.accept) e.accept = 'Husk at acceptere vores handelsbetingelser'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
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
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Rekruna One Abonnement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 border-2 rounded-lg border-primary">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Månedligt</p>
                    <p className="text-gray-600">Fleksibel betaling hver måned</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-gray-900">299</span>
                    <span className="text-lg text-gray-900 ml-1">kr</span>
                    <p className="text-gray-600">/måned</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Betaling */}
          <Card>
            <CardHeader>
              <CardTitle>
                <CreditCard className="inline h-6 w-6 mr-2" /> Betalingsoplysninger
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cardNumber">Kortnummer</Label>
                <Input id="cardNumber" value={form.cardNumber} onChange={(e) => setField('cardNumber', e.target.value)} placeholder="1234 5678 9012 3456" />
                {errors.cardNumber && <p className="text-sm text-red-600 mt-1">{errors.cardNumber}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry">Udløb</Label>
                  <Input id="expiry" value={form.expiry} onChange={(e) => setField('expiry', e.target.value)} placeholder="MM/ÅÅ" />
                  {errors.expiry && <p className="text-sm text-red-600 mt-1">{errors.expiry}</p>}
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input id="cvv" value={form.cvv} onChange={(e) => setField('cvv', e.target.value)} placeholder="123" />
                  {errors.cvv && <p className="text-sm text-red-600 mt-1">{errors.cvv}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="cardName">Navn på kort</Label>
                <Input id="cardName" value={form.cardName} onChange={(e) => setField('cardName', e.target.value)} placeholder="Navn som det står på kortet" />
                {errors.cardName && <p className="text-sm text-red-600 mt-1">{errors.cardName}</p>}
              </div>
              <div className="flex items-start gap-2 pt-2">
                <input id="accept" required type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300" checked={form.accept} onChange={(e) => setField('accept', e.target.checked)} />
                <Label htmlFor="accept" className="text-gray-700">
                  Jeg bekræfter at have læst og accepterer Rekruna{' '}
                  <Link href="/handelsbetingelser" className="text-primary underline underline-offset-2">
                    handelsbetingelser
                  </Link>
                </Label>
              </div>
              {errors.accept && <p className="text-sm text-red-600 mt-1">{errors.accept}</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="text-center">
        <Button type="submit" disabled={isLoading} className="px-12 py-6 text-lg font-semibold">
          {isLoading ? 'Opretter...' : 'Opret konto'}
        </Button>
      </div>
    </form>
  )
}
