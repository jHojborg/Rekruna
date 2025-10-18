interface ProcessingSectionProps {
  total: number
  processed: number
  currentFile?: string
}

export function ProcessingSection({ total, processed, currentFile }: ProcessingSectionProps) {
  // Calculate progress percentage
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0
  
  // Determine status message based on progress
  const getStatusMessage = () => {
    if (processed === 0) {
      return 'Starter analyse...'
    } else if (processed < total) {
      return `Analyserer CV ${processed} af ${total}...`
    } else {
      return 'Analyse færdig! ✅'
    }
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Analyseforløb</h2>
      
      {/* Progress bar with animated fill */}
      <div className="w-full bg-gray-200 rounded-lg h-6 overflow-hidden mb-4">
        <div 
          className="h-6 bg-primary transition-all duration-500 ease-out flex items-center justify-end pr-2" 
          style={{ width: `${pct}%` }}
        >
          {pct > 10 && (
            <span className="text-white text-sm font-semibold">{pct}%</span>
          )}
        </div>
      </div>
      
      {/* Status text */}
      <div className="space-y-2">
        <p className="text-gray-900 font-medium">{getStatusMessage()}</p>
        
        {/* Current file being processed */}
        {currentFile && processed < total && (
          <div className="flex items-center gap-2">
            <div className="animate-pulse h-2 w-2 bg-primary rounded-full"></div>
            <p className="text-gray-600 text-sm">
              {currentFile}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
