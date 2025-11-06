"use client"

import Link from 'next/link'
import { Clock, CheckCircle2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

// =====================================================
// EVENT SIGNUP PENDING PAGE
// Vises efter EVENT signup er indsendt
// Fortæller brugeren at deres anmodning afventer godkendelse
// =====================================================

export default function EventSignupPendingPage() {
  return (
    <main className="min-h-screen bg-brand-base py-16 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Success Icon */}
        <div className="text-center">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-primary/15 text-primary flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          
          {/* Headline */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Tak for din interesse!
          </h1>
          
          {/* Description */}
          <p className="text-lg text-gray-700 mb-8">
            Din demo anmodning er modtaget og afventer nu godkendelse.
          </p>
        </div>

        {/* Info Cards */}
        <div className="space-y-6 mt-10">
          
          {/* Hvad sker nu? */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <Clock className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Hvad sker nu?
                </h2>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">1.</span>
                    <span>Vi behandler din anmodning inden for 24 timer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">2.</span>
                    <span>Du modtager en email når din demo konto er klar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">3.</span>
                    <span>Log ind og få adgang til 100 credits i 14 dage</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Hvad får du adgang til? */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <Mail className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Hvad får du adgang til?
                </h2>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    <span>Fuld adgang til Rekruna platform</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    <span>100 credits til CV screening</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    <span>AI-drevet kandidat analyse</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    <span>PDF rapport generering</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    <span>14 dages gratis afprøvning</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
        </div>

        {/* Call to Action */}
        <div className="mt-10 text-center space-y-4">
          <p className="text-gray-600">
            Hold øje med din indbakke for en email fra os
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button variant="outline">
                Tilbage til forsiden
              </Button>
            </Link>
            <Link href="/kontakt">
              <Button variant="outline">
                Har du spørgsmål? Kontakt os
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Footer Note */}
        <div className="mt-12 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 text-center">
            💡 <strong>Tip:</strong> Tjek også din spam-mappe hvis du ikke modtager en email inden for 24 timer.
          </p>
        </div>
        
      </div>
    </main>
  )
}

