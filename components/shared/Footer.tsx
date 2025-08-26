// Simple site footer. Keeps consistent spacing and neutral styling.
// You can expand with links or legal text later.

export function Footer() {
  return (
    <footer className="py-8 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-sm text-gray-500">© {new Date().getFullYear()} Rekruna. Alle rettigheder forbeholdes.</p>
      </div>
    </footer>
  )
}


