// Kontakt os side - Formular til at kontakte Rekruna support
// Sender emails til support@rekruna.dk
// Bruger samme design system som resten af sitet
"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

export default function KontaktPage() {
  // Form state - holder styr på alle felter i formularen
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    subject: '',
    message: ''
  })

  // Handle input changes - opdaterer state når brugeren skriver
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Handle form submission - sender data til API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simple validation - tjek at påkrævede felter er udfyldt
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Udfyld venligst alle påkrævede felter')
      return
    }

    // Email validation - tjek at email er gyldig
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Indtast venligst en gyldig email')
      return
    }

    setLoading(true)

    try {
      // Send email via API
      const response = await fetch('/api/contact', {
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

      // Success! Vis besked til brugeren
      toast.success('Din besked er sendt! Vi svarer inden for 24 timer.')
      
      // Reset form - ryd alle felter
      setFormData({
        name: '',
        company: '',
        email: '',
        subject: '',
        message: ''
      })
    } catch (error) {
      console.error('Contact form error:', error)
      toast.error('Der skete en fejl. Prøv venligst igen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Hero section med headline */}
      <section className="py-20 bg-brand-base">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 leading-tight mb-4">
              Kontakt os
            </h1>
            <p className="text-xl text-gray-700">
              Vi tilstræber at svare på din besked indenfor 24 timer
            </p>
          </div>
        </div>
      </section>

      {/* Contact form section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            {/* Form card med skygge som på Om os siden */}
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-[4px_6px_16px_rgba(0,0,0,0.25)]">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Fornavn + Efternavn */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    For- og efternavn <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Dit fulde navn"
                  />
                </div>

                {/* Firmanavn */}
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    Firmanavn
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Dit firma (valgfrit)"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
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

                {/* Emne */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Emne
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Hvad handler din henvendelse om?"
                  />
                </div>

                {/* Besked */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Besked <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="Skriv din besked her..."
                  />
                </div>

                {/* Submit button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full py-6 text-lg"
                  >
                    {loading ? 'Sender...' : 'Send besked'}
                  </Button>
                </div>
              </form>
            </div>

            {/* Alternative kontakt info */}
            <div className="mt-8 text-center text-gray-600">
              <p className="text-sm">
                Eller send direkte email til:{' '}
                <a href="mailto:support@rekruna.dk" className="text-primary-600 hover:text-primary-700 font-medium">
                  support@rekruna.dk
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

