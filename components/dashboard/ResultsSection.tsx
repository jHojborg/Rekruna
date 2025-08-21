interface ResultItem {
  name: string
  overall: number
  scores: Record<string, number>
  strengths: string[]
  concerns: string[]
}

interface ResultsSectionProps {
  results: ResultItem[]
}

export function ResultsSection({ results }: ResultsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Analyse resultat</h2>
        <div className="space-y-6">
          {results.map((r, i) => (
            <div key={i} className="border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{r.name}</h3>
                  <div className="flex items-center mt-2">
                    <span className="text-sm font-medium text-gray-600 mr-2">Overall:</span>
                    <span className="text-2xl font-bold text-primary">{r.overall}/10</span>
                  </div>
                </div>
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary text-white"
                  style={{ backgroundColor: i < 10 ? '#10b984' : undefined }}
                >
                  #{i + 1} Prioritet
                </span>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Styrker</h4>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    {r.strengths.map((s, j) => <li key={j}>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Opmærksomhedsområder</h4>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    {r.concerns.map((s, j) => <li key={j}>{s}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Kandidat Sammenligning</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-900">Kandidat</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-900">Overall</th>
                {Object.keys(results[0]?.scores || {}).map((k) => (
                  <th key={k} className="px-4 py-2 text-left font-semibold text-gray-900">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 font-medium text-gray-900">{r.name}</td>
                  <td className="px-4 py-2 text-primary">{r.overall}/10</td>
                  {Object.keys(results[0]?.scores || {}).map((k) => (
                    <td key={k} className="px-4 py-2">{r.scores[k]}%</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
