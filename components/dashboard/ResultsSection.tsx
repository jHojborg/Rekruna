import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface ResultItem {
  name: string
  overall: number
  scores: Record<string, number>
  strengths: string[]
  concerns: string[]
  has_cached_resume?: boolean
  cv_text_hash?: string
}

interface ResultsSectionProps {
  results: ResultItem[]
}

interface ResumeModalProps {
  isOpen: boolean
  onClose: () => void
  candidateName: string
  resumeText: string | null
  isLoading: boolean
}

function ResumeModal({ isOpen, onClose, candidateName, resumeText, isLoading }: ResumeModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-gray-900">CV Resumé - {candidateName}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              aria-label="Luk"
            >
              ×
            </button>
          </div>
          
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-gray-600">Genererer resumé...</span>
            </div>
          )}
          
          {!isLoading && resumeText && (
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {resumeText}
              </div>
            </div>
          )}
          
          {!isLoading && !resumeText && (
            <div className="text-center py-8">
              <p className="text-gray-500">Kunne ikke generere resumé for denne kandidat.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ResultsSection({ results }: ResultsSectionProps) {
  const [selectedResume, setSelectedResume] = useState<{
    candidateName: string
    resumeText: string | null
    isLoading: boolean
  } | null>(null)

  // Function to fetch resume from API
  const fetchResume = async (candidateName: string, cvTextHash: string) => {
    setSelectedResume({
      candidateName,
      resumeText: null,
      isLoading: true
    })

    try {
      // Get authentication token from Supabase
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      
      if (!accessToken) {
        console.error('No access token available')
        setSelectedResume({
          candidateName,
          resumeText: null,
          isLoading: false
        })
        return
      }

      console.log('Fetching resume for:', candidateName, 'with hash:', cvTextHash.substring(0, 8) + '...')

      const response = await fetch('/api/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          candidateName,
          cvTextHash
        })
      })

      const data = await response.json()
      
      console.log('Resume API response:', { 
        status: response.status, 
        ok: data.ok, 
        error: data.error,
        hasResume: !!data.resume 
      })
      
      if (data.ok && data.resume) {
        setSelectedResume({
          candidateName,
          resumeText: data.resume,
          isLoading: false
        })
      } else {
        console.error('Resume fetch failed:', data.error || 'Unknown error')
        setSelectedResume({
          candidateName,
          resumeText: null,
          isLoading: false
        })
      }
    } catch (error) {
      console.error('Failed to fetch resume:', error)
      setSelectedResume({
        candidateName,
        resumeText: null,
        isLoading: false
      })
    }
  }

  const closeModal = () => {
    setSelectedResume(null)
  }

  return (
    <>
      {/* Resume Modal */}
      <ResumeModal
        isOpen={!!selectedResume}
        onClose={closeModal}
        candidateName={selectedResume?.candidateName || ''}
        resumeText={selectedResume?.resumeText || null}
        isLoading={selectedResume?.isLoading || false}
      />
      
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
                <div className="flex flex-col items-end space-y-2">
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary text-white"
                    style={{ backgroundColor: i < 10 ? '#10b984' : undefined }}
                  >
                    #{i + 1} Prioritet
                  </span>
                  
                  {/* Resume button for top 3 candidates only */}
                  {i < 3 && r.cv_text_hash && (
                    <button
                      onClick={() => fetchResume(r.name, r.cv_text_hash!)}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors duration-200 flex items-center space-x-1"
                      title={r.has_cached_resume ? 'Se cached resumé' : 'Generer resumé'}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>CV Resumé</span>
                      {r.has_cached_resume && (
                        <span className="inline-flex items-center justify-center w-2 h-2 bg-green-400 rounded-full ml-1"></span>
                      )}
                    </button>
                  )}
                </div>
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
    </>
  )
}
