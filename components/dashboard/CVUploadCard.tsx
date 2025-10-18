"use client"

import { Upload, FileText, X, CheckCircle2, Trash2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UPLOAD_LIMITS, uploadHelpers } from '@/lib/constants'
import { validatePdfs } from '@/lib/pdf/validation'
import { useState } from 'react'

interface CVUploadCardProps {
  files: File[]
  onFilesSelected: (files: File[]) => void
  onAnalyze: () => void
  onBack: () => void
}

export function CVUploadCard({ files, onFilesSelected, onAnalyze, onBack }: CVUploadCardProps) {
  const [validating, setValidating] = useState(false)
  const [validationProgress, setValidationProgress] = useState({ current: 0, total: 0 })

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || [])
    
    // 1. Check PDF format first (quick check)
    const nonPdf = newFiles.filter((f) => !/\.pdf$/i.test(f.name))
    if (nonPdf.length) {
      alert('Kun PDF-filer er tilladt.')
      return
    }
    
    // 2. Validate file limits (count, size)
    const validation = uploadHelpers.validateFiles(newFiles)
    if (!validation.valid) {
      alert(validation.error)
      return
    }
    
    // 3. Validate PDF quality (async, takes time)
    setValidating(true)
    setValidationProgress({ current: 0, total: newFiles.length })
    
    try {
      const pdfValidation = await validatePdfs(newFiles, (current, total) => {
        setValidationProgress({ current, total })
      })
      
      if (!pdfValidation.valid) {
        // Show list of invalid files
        const errorList = pdfValidation.invalidFiles
          .map(({ file, error }) => `• ${file.name}: ${error}`)
          .join('\n')
        
        alert(`Følgende filer kunne ikke valideres:\n\n${errorList}`)
        return
      }
      
      // All valid!
      onFilesSelected(newFiles)
      
    } catch (error) {
      alert('Kunne ikke validere PDF-filer. Prøv igen.')
    } finally {
      setValidating(false)
      setValidationProgress({ current: 0, total: 0 })
    }
  }

  // Remove individual file
  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    onFilesSelected(updatedFiles)
  }

  // Clear all files
  const clearAll = () => {
    onFilesSelected([])
  }

  // Format file size in human-readable format
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="flex flex-col items-center text-center">
        <Upload className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">(2) Upload CV&#39;er</h2>
        <p className="text-gray-600 mb-8">Upload de relevante CV´r som PDF.</p>

        {validating ? (
          // Validating state with progress
          <div className="w-full">
            <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-10 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-lg font-medium text-gray-900">Validerer CVer...</p>
              <p className="text-gray-500 text-sm mt-1">
                Tjekker kvalitet og læsbarhed ({validationProgress.current}/{validationProgress.total})
              </p>
              <div className="w-full max-w-xs mt-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ 
                      width: `${validationProgress.total > 0 ? (validationProgress.current / validationProgress.total) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : files.length === 0 ? (
          // Upload area when no files selected
          <label className="w-full cursor-pointer">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 flex flex-col items-center justify-center hover:bg-gray-50 transition">
              <FileText className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-lg font-medium text-gray-900">Klik for at vælge CV&apos;er</p>
              <p className="text-gray-500 text-sm mt-1">Flere PDF-filer kan vælges samtidigt (Maks {UPLOAD_LIMITS.MAX_CV_COUNT})</p>
            </div>
            <input type="file" accept=".pdf" multiple onChange={onChange} className="hidden" disabled={validating} />
          </label>
        ) : (
          // Files preview when files are selected
          <div className="w-full space-y-4">
            {/* Header with file count and clear all button */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-gray-900">{files.length} fil(er) valgt</span>
              </div>
              <button
                onClick={clearAll}
                className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Ryd alle
              </button>
            </div>

            {/* Files list with max height and scroll */}
            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="flex-shrink-0 p-1 hover:bg-red-100 rounded-full transition-colors group"
                      title="Fjern fil"
                    >
                      <X className="h-4 w-4 text-gray-400 group-hover:text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add more files button */}
            <label className="inline-block cursor-pointer">
              <div className="text-sm text-primary hover:text-primary/80 underline flex items-center gap-1 justify-center">
                <Upload className="h-4 w-4" />
                Tilføj flere filer
              </div>
              <input type="file" accept=".pdf" multiple onChange={onChange} className="hidden" disabled={validating} />
            </label>
          </div>
        )}

        <div className="flex items-center gap-4 mt-8">
          <Button variant="outline" onClick={onBack} className="px-8 py-6 text-lg" disabled={validating}>
            ← Tilbage
          </Button>
          <Button className="px-8 py-6 text-lg" onClick={onAnalyze} disabled={files.length === 0 || validating}>
            Analyser CV&#39;er
          </Button>
        </div>
      </div>
    </div>
  )
}
