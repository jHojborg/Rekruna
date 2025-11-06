"use client"

import { useState } from 'react'
import { Building2, User, Phone, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// =====================================================
// EVENT SIGNUP FORM
// Simplificeret signup formular til EVENT demo kunder
// KUN: Firmanavn, Navn, Telefon, Email, Kodeord
// UDEN: CVR, Adresse, Postnr, By, Betalingssektion
// =====================================================

interface EventSignupFormProps {
  onSubmit?: (data: any) => void
  isLoading?: boolean
}

// Password validation: Min 8 tegn, store+små+specialtegn
const passwordOk = (pwd: string) => 
  /[A-Z]/.test(pwd) && 
  /[a-z]/.test(pwd) && 
  /[^A-Za-z0-9]/.test(pwd) && 
  pwd.length >= 8

export function EventSignupForm({ 
  onSubmit, 
  isLoading = false 
}: EventSignupFormProps) {
  
  // =====================================================
  // STATE
  // =====================================================
  
  const [form, setForm] = useState({
    companyName: '',
    name: '',
    phone: '',
    email: '',
    password: '',
    accept: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // =====================================================
  // HELPERS
  // =====================================================
  
  const setField = (k: string, v: string | boolean) => 
    setForm((s) => ({ ...s, [k]: v }))

  // =====================================================
  // VALIDATION
  // =====================================================
  
  const validate = () => {
    const e: Record<string, string> = {}
    
    // Helper functions
    const isEmpty = (val: string) => !val || val.trim().length === 0
    const hasLetters = (val: string) => /[a-zA-ZæøåÆØÅ]/.test(val.trim())
    
    // ============================================
    // FIRMANAVN - Required, must contain letters
    // ============================================
    if (isEmpty(form.companyName)) {
      e.companyName = 'Firmanavn er påkrævet'
    } else if (!hasLetters(form.companyName)) {
      e.companyName = 'Firmanavn skal indeholde bogstaver'
    }
    
    // ============================================
    // NAVN - Required, must contain letters, min 2 characters
    // ============================================
    if (isEmpty(form.name)) {
      e.name = 'Navn er påkrævet'
    } else if (!hasLetters(form.name)) {
      e.name = 'Navn skal indeholde bogstaver'
    } else if (form.name.trim().length < 2) {
      e.name = 'Navn skal være mindst 2 tegn'
    }
    
    // ============================================
    // TELEFON - Required, exactly 8 digits (Danish format)
    // ============================================
    if (isEmpty(form.phone)) {
      e.phone = 'Telefonnummer er påkrævet'
    } else {
      // Remove spaces and hyphens for validation
      const cleanedPhone = form.phone.trim().replace(/[\s-]/g, '')
      
      if (!/^\d{8}$/.test(cleanedPhone)) {
        e.phone = 'Telefonnummer skal være 8 cifre (dansk format)'
      }
    }
    
    // ============================================
    // EMAIL - Required, must be valid email format
    // ============================================
    if (isEmpty(form.email)) {
      e.email = 'Email er påkrævet'
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      e.email = 'Ugyldig email'
    }
    
    // ============================================
    // PASSWORD - Complex validation for security
    // ============================================
    if (!form.password || form.password.length < 8) {
      e.password = 'Kodeord skal være mindst 8 tegn'
    } else if (!/[A-Z]/.test(form.password)) {
      e.password = 'Kodeord mangler store bogstaver (A-Z)'
    } else if (!/[a-z]/.test(form.password)) {
      e.password = 'Kodeord mangler små bogstaver (a-z)'
    } else if (!/[^A-Za-z0-9]/.test(form.password)) {
      e.password = 'Kodeord mangler specialtegn (f.eks. !@#$%^&*)'
    }
    
    // ============================================
    // HANDELSBETINGELSER - Required checkbox
    // ============================================
    if (!form.accept) {
      e.accept = 'Husk at acceptere vores handelsbetingelser'
    }
    
    setErrors(e)
    return Object.keys(e).length === 0
  }
  
  // =====================================================
  // SUBMIT HANDLER
  // =====================================================
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Run validation and show errors if any
    const isValid = validate()
    
    if (!isValid) {
      // Scroll to first error
      setTimeout(() => {
        const firstErrorElement = document.querySelector('.text-red-600') as HTMLElement
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
      return
    }
    
    // Trim all string fields before submitting
    // This ensures clean data is stored in the database
    const cleanedData = {
      ...form,
      companyName: form.companyName.trim(),
      name: form.name.trim(),
      phone: form.phone.trim().replace(/[\s-]/g, ''), // Remove spaces and hyphens
      email: form.email.trim().toLowerCase(),
      // Note: password is NOT trimmed - whitespace can be part of the password
    }
    
    onSubmit?.(cleanedData)
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Tilmeld dig demo</CardTitle>
          <CardDescription>
            Udfyld formularen for at få adgang til Rekruna demo
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-5">
          
          {/* Firmanavn */}
          <div>
            <Label htmlFor="companyName">Firmanavn</Label>
            <div className="relative mt-1">
              <Input 
                id="companyName" 
                value={form.companyName} 
                onChange={(e) => setField('companyName', e.target.value)} 
                placeholder="Dit firmanavn"
                className="pl-10"
              />
              <Building2 className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
            </div>
            {errors.companyName && <p className="text-sm text-red-600 mt-1">{errors.companyName}</p>}
          </div>
          
          {/* Dit navn */}
          <div>
            <Label htmlFor="name">Dit navn</Label>
            <div className="relative mt-1">
              <Input 
                id="name" 
                value={form.name} 
                onChange={(e) => setField('name', e.target.value)} 
                className="pl-10" 
                placeholder="Dit fulde navn" 
              />
              <User className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
            </div>
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
          </div>
          
          {/* Telefon */}
          <div>
            <Label htmlFor="phone">Dit telefonnummer</Label>
            <div className="relative mt-1">
              <Input 
                id="phone" 
                type="tel"
                value={form.phone} 
                onChange={(e) => setField('phone', e.target.value)} 
                className="pl-10" 
                placeholder="12345678" 
              />
              <Phone className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
            </div>
            {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
            <p className="text-xs text-gray-500 mt-1">8 cifre, dansk format</p>
          </div>
          
          {/* Email */}
          <div>
            <Label htmlFor="email">Email adresse</Label>
            <div className="relative mt-1">
              <Input 
                id="email" 
                type="email" 
                value={form.email} 
                onChange={(e) => setField('email', e.target.value)} 
                className="pl-10" 
                placeholder="din@email.dk" 
              />
              <Mail className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
            </div>
            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
          </div>
          
          {/* Kodeord */}
          <div>
            <Label htmlFor="password">Kodeord</Label>
            <div className="relative mt-1">
              <Input 
                id="password" 
                type="password" 
                value={form.password} 
                onChange={(e) => setField('password', e.target.value)} 
                className="pl-10" 
                placeholder="Min. 8 tegn, store+små + specialtegn" 
              />
              <Lock className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
            </div>
            {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
          </div>
          
          {/* Handelsbetingelser */}
          <div className="pt-4 space-y-4">
            <div className="flex items-start gap-2">
              <input 
                id="accept" 
                required 
                type="checkbox" 
                className="mt-1 h-4 w-4 rounded border-gray-300" 
                checked={form.accept} 
                onChange={(e) => setField('accept', e.target.checked)} 
              />
              <Label htmlFor="accept" className="text-gray-700 cursor-pointer">
                Jeg bekræfter at have læst og accepterer Rekruna{' '}
                <a 
                  href="/handelsbetingelser" 
                  target="_blank"
                  className="text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  handelsbetingelser
                </a>
              </Label>
            </div>
            {errors.accept && <p className="text-sm text-red-600">{errors.accept}</p>}
          </div>
          
          {/* Submit Button */}
          <div className="flex flex-col items-center pt-4">
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="px-8 py-3 text-base font-semibold w-full max-w-xs"
            >
              {isLoading ? 'Behandler...' : 'Tilmeld'}
            </Button>
            <p className="text-sm text-gray-600 text-center mt-3">
              Du får adgang til demo med 100 credits i 14 dage
            </p>
          </div>
          
        </CardContent>
      </Card>
    </form>
  )
}

