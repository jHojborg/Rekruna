"use client"

import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'

export default function SentryExamplePage() {
  return (
    <main className="min-h-screen bg-brand-base py-16 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-xl border border-gray-200 p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Sentry test</h1>
        <p className="text-gray-700">Klik på en af knapperne for at sende en test-fejl til Sentry.</p>
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={() => {
              // Unhandled fejl (vil blive opsamlet af Sentry automatisk)
              throw new Error('Sentry: klient testfejl (unhandled)')
            }}
          >
            Udløs unhandled fejl
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              Sentry.captureException(new Error('Sentry: klient testfejl (captured)'))
              alert('Sendt til Sentry (capturedException)')
            }}
          >
            Send captured fejl
          </Button>
        </div>
      </div>
    </main>
  )
}


