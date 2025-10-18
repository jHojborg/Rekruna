"use client"
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function CheckoutCancelPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <X className="w-8 h-8 text-gray-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Køb Annulleret
        </h1>
        
        <p className="text-gray-600 mb-6">
          Ingen bekymringer! Dit køb blev annulleret, og der er ikke blevet trukket penge.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            💡 Har du spørgsmål om vores priser eller planer? Kontakt os gerne!
          </p>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/#pricing">
              Tilbage til Priser
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard">
              Gå til Dashboard
            </Link>
          </Button>
          
          <Button asChild variant="ghost" className="w-full">
            <Link href="/">
              Til Forsiden
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}





