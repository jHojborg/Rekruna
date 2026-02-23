// Demo Signup side - Marketing landingsside for demo anmodninger
// Besøgende kan tilmelde sig demo/demo af Rekruna
// Sender signup til support@rekruna.dk og gemmer i Supabase
"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

export default function DemoSignupPage() {
  // State til at tracke om formularen er submitted
  const [submitted, setSubmitted] = useState(false)
  
  // State til loading under submission
  const [loading, setLoading] = useState(false)
  
  // Form data - holder styr på alle felter i formularen
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    bestDay: '',
    bestTime: ''
  })

  // Handle input changes - opdaterer state når brugeren skriver
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Handle form submission - validering og send til API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validering - tjek at alle påkrævede felter er udfyldt
    if (!formData.companyName || !formData.contactName || !formData.phone || 
        !formData.email || !formData.bestDay || !formData.bestTime) {
      toast.error('Udfyld venligst alle felter')
      return
    }

    // Email validering - tjek at email er gyldig
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Indtast venligst en gyldig email')
      return
    }

    // Telefon validering - skal være mindst 8 cifre
    const phoneDigits = formData.phone.replace(/\D/g, '')
    if (phoneDigits.length < 8) {
      toast.error('Indtast venligst et gyldigt telefonnummer (mindst 8 cifre)')
      return
    }

    setLoading(true)

    try {
      // Send demo signup til API
      const response = await fetch('/api/demo-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Noget gik galt')
      }

      // Success! Vis tak beskeden
      setSubmitted(true)
      toast.success('Tak! Vi kontakter dig snarest.')
      
    } catch (error) {
      console.error('Demo signup error:', error)
      toast.error('Der skete en fejl. Prøv venligst igen.')
    } finally {
      setLoading(false)
    }
  }

  // Hvis formularen er submitted, vis tak besked
  if (submitted) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl border border-gray-100 p-12 shadow-[4px_6px_16px_rgba(0,0,0,0.25)]">
            {/* Success icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            {/* Tak besked */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Tak for din interesse!
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Du hører fra os snarest.
            </p>
            <p className="text-gray-600">
              Vi kontakter dig på de oplysninger du har givet os.
            </p>
            
            {/* Link tilbage til forsiden */}
            <div className="mt-8">
              <Link
                href="/"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                ← Tilbage til forsiden
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Vis formular (før submission)
  return (
    <main className="min-h-screen bg-white">
      {/* Hero section med headline og brødtekst */}
      <section className="py-20 bg-brand-base">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 leading-tight mb-4">
              Velkommen til Rekruna Demo
            </h1>
            <p className="text-xl text-gray-700">
              Udfyld formularen nedenfor, så kontakter vi dig for aftale af et tidspunkt.
            </p>
          </div>
        </div>
      </section>

      {/* Demo signup form section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            {/* Form card med skygge som på kontakt siden */}
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-[4px_6px_16px_rgba(0,0,0,0.25)]">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Firmanavn */}
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                    Firmanavn <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Jeres firmanavn"
                  />
                </div>

                {/* Dit navn */}
                <div>
                  <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-2">
                    Dit navn <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="contactName"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Dit fulde navn"
                  />
                </div>

                {/* Dit tel.nr */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Dit tel.nr <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="12345678"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Indtast dit telefonnummer uden mellemrum
                  </p>
                </div>

                {/* Din e-mail */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Din e-mail <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="din@email.dk"
                  />
                </div>

                {/* Træffes bedst dag */}
                <div>
                  <label htmlFor="bestDay" className="block text-sm font-medium text-gray-700 mb-2">
                    Træffes bedst dag <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="bestDay"
                    name="bestDay"
                    value={formData.bestDay}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="F.eks. mandag-onsdag, alle hverdage, mv."
                  />
                </div>

                {/* Træffes bedst tidspunkt */}
                <div>
                  <label htmlFor="bestTime" className="block text-sm font-medium text-gray-700 mb-2">
                    Træffes bedst tidspunkt <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="bestTime"
                    name="bestTime"
                    value={formData.bestTime}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="F.eks. mellem 9-12, efter kl. 14, mv."
                  />
                </div>

                {/* Submit button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full py-6 text-lg"
                  >
                    {loading ? 'Sender...' : 'Send - så kontakter vi dig'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

