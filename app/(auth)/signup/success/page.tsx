"use client"

import Link from 'next/link'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SignupSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-brand-base py-16 px-4">
          <div className="max-w-3xl mx-auto text-center text-gray-700">Indlæser…</div>
        </main>
      }
    >
      <SignupSuccessInner />
    </Suspense>
  )
}

function SignupSuccessInner() {
  const search = useSearchParams()
  const name = search.get('name') || 'Din konto'
  const receiptUrl = search.get('receipt_url') || undefined
  const receiptId = search.get('receipt_id') || '—'

  return (
    <main className="min-h-screen bg-brand-base py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Confirmation */}
        <div className="text-center">
          <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-primary/15 text-primary flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Tak for din tilmelding</h1>
          <p className="text-gray-700 mb-8">{name} er nu oprettet. En bekræftelse og kvittering er sendt til din email.</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard">
              <Button>Gå til dashboard</Button>
            </Link>
            {receiptUrl && (
              <a href={receiptUrl} target="_blank" rel="noreferrer">
                <Button variant="outline">Åbn kvittering i Stripe</Button>
              </a>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="my-10 h-px bg-gray-200" />

        {/* Inline receipt */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Receipt className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Kvittering</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 text-gray-700">
            <p><span className="font-medium">Kvitterings-ID:</span> {receiptId}</p>
            <p><span className="font-medium">Plan:</span> Rekruna One</p>
            <p><span className="font-medium">Beløb:</span> 299 kr / måned</p>
            <p><span className="font-medium">Status:</span> Betaling gennemført</p>
          </div>

          <div className="mt-6 flex gap-3">
            {receiptUrl && (
              <a href={receiptUrl} target="_blank" rel="noreferrer">
                <Button variant="outline">Åbn kvittering i Stripe</Button>
              </a>
            )}
            <Link href="/dashboard">
              <Button>Gå til dashboard</Button>
            </Link>
          </div>

          {!receiptUrl && (
            <p className="text-sm text-gray-600 mt-4">Kvitteringen er sendt pr. email. Du kan også åbne den via Stripe-linket i din mail.</p>
          )}
        </section>
      </div>
    </main>
  )
}

