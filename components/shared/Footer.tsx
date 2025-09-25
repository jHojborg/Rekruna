// Simple site footer. Keeps consistent spacing and neutral styling.
// You can expand with links or legal text later.
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="py-8 bg-brand-softGrey border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* First line: Navigation links */}
        <div className="flex justify-center gap-8 mb-4">
          <Link href="/om-os" className="text-sm text-gray-600 hover:text-gray-900 font-semibold">
            Om os
          </Link>
          <Link href="/kontakt" className="text-sm text-gray-600 hover:text-gray-900 font-semibold">
            Kontakt os
          </Link>
        </div>
        
        {/* Second line: Copyright */}
        <p className="text-sm text-gray-500">© {new Date().getFullYear()} Rekruna. Alle rettigheder forbeholdes.</p>
      </div>
    </footer>
  )
}


