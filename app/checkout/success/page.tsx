"use client"
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // Give webhook time to process (webhooks are usually faster than redirect)
    const timer = setTimeout(() => {
      setStatus('success')
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (status === 'verifying') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Bekræfter dit køb...
          </h1>
          <p className="text-gray-600">
            Vent venligst mens vi behandler din ordre.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Tillykke! 🎉
        </h1>
        
        <p className="text-gray-600 mb-6">
          Din betaling er gennemført, og dine credits er nu tilgængelige.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-2">
            Du modtager en kvittering på email om lidt.
          </p>
          <p className="text-xs text-gray-500">
            Session ID: {sessionId?.slice(0, 20)}...
          </p>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/dashboard">
              Gå til Dashboard
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full">
            <Link href="/analyze">
              Start CV Screening
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}





