/**
 * Demo booked – Tak-side efter form submit på demo-a/demo-b
 *
 * Bruger lander her efter succesfuld indsendelse af demo-video formular.
 * TrackCompleteRegistration sender kun CompleteRegistration event fra denne side.
 */
import Link from 'next/link'
import TrackCompleteRegistration from '@/components/shared/TrackCompleteRegistration'

export default function DemoBookedPage() {
  return (
    <>
      <TrackCompleteRegistration />

      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl border border-gray-100 p-12 shadow-[4px_6px_16px_rgba(0,0,0,0.25)]">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Tak for din booking</h1>
            <p className="text-xl text-gray-700 mb-8">Vi kontakter dig snarest muligt.</p>
            <Link
              href="/"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              ← Tilbage til forsiden
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
