'use client'

/**
 * DemoContactForm – Kontaktformular til demo-siden (/demo)
 *
 * Matcher formularen på /demo-signup: Firmanavn, Dit navn, Tel.nr, E-mail,
 * Træffes bedst dag, Træffes bedst tidspunkt. Sender til /api/demo-signup.
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

export function DemoContactForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    bestDay: '',
    bestTime: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.companyName || !formData.contactName || !formData.phone ||
        !formData.email || !formData.bestDay || !formData.bestTime) {
      toast.error('Udfyld venligst alle felter')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Indtast venligst en gyldig email')
      return
    }

    const phoneDigits = formData.phone.replace(/\D/g, '')
    if (phoneDigits.length < 8) {
      toast.error('Indtast venligst et gyldigt telefonnummer (mindst 8 cifre)')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/demo-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Noget gik galt')
      }

      toast.success('Tak! Vi kontakter dig snarest.')
      router.push('/demo-booked')
    } catch (error) {
      console.error('Demo signup error:', error)
      toast.error('Der skete en fejl. Prøv venligst igen.')
    } finally {
      setLoading(false)
    }
  }

  return (
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
          <Button type="submit" disabled={loading} className="w-full py-6 text-lg">
            {loading ? 'Sender...' : 'Send - så kontakter vi dig'}
          </Button>
        </div>
      </form>
    </div>
  )
}
