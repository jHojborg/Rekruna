'use client'

/**
 * DemoContactForm – Kontaktformular til demo-sider
 *
 * Felter: navn, firma, e-mail, checkbox "Ja tak til at modtage video samt ...."
 * Sender til API som mailer til support@rekruna.dk.
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { DEMO_FORM } from '@/lib/demo-content'

export function DemoContactForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    wantsVideo: false
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email) {
      toast.error('Udfyld venligst navn og e-mail')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Indtast venligst en gyldig e-mail')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/demo-video-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Noget gik galt')
      }

      toast.success('Tak! Vi sender dig videoen snarest.')
      router.push('/demo-booked')
    } catch (error) {
      console.error('Demo video signup error:', error)
      toast.error('Der skete en fejl. Prøv venligst igen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-[4px_6px_16px_rgba(0,0,0,0.25)]">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            {DEMO_FORM.nameLabel} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={DEMO_FORM.namePlaceholder}
          />
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
            {DEMO_FORM.companyLabel}
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={DEMO_FORM.companyPlaceholder}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            {DEMO_FORM.emailLabel} <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={DEMO_FORM.emailPlaceholder}
          />
        </div>

        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="wantsVideo"
            name="wantsVideo"
            checked={formData.wantsVideo}
            onChange={handleChange}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="wantsVideo" className="text-sm text-gray-700">
            {DEMO_FORM.checkboxLabel}
          </label>
        </div>

        <div className="pt-4">
          <Button type="submit" disabled={loading} className="w-full py-6 text-lg">
            {loading ? DEMO_FORM.submitLoading : DEMO_FORM.submitButton}
          </Button>
        </div>
      </form>
    </div>
  )
}
