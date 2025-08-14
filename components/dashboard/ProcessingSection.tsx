interface ProcessingSectionProps {
  total: number
  processed: number
  currentFile?: string
}

export function ProcessingSection({ total, processed, currentFile }: ProcessingSectionProps) {
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Resultat af analysen</h2>
      <div className="w-full bg-gray-200 rounded h-4 overflow-hidden">
        <div className="h-4 bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-gray-600 mt-3">{processed}/{total} CV'er</p>
      {currentFile && <p className="text-gray-500 mt-1">Behandler: {currentFile}</p>}
    </div>
  )
}
