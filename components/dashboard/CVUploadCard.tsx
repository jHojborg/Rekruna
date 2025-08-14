"use client"

import { Upload, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CVUploadCardProps {
  count: number
  onFilesSelected: (files: File[]) => void
  onAnalyze: () => void
}

export function CVUploadCard({ count, onFilesSelected, onAnalyze }: CVUploadCardProps) {
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 50) {
      alert('Der kan maks uploades 50 CV\'er ad gangen. Vælg færre filer.')
      return
    }
    const nonPdf = files.filter((f) => !/\.pdf$/i.test(f.name))
    if (nonPdf.length) {
      alert('Kun PDF-filer er tilladt.')
      return
    }
    if (files.length) onFilesSelected(files)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="flex flex-col items-center text-center">
        <Upload className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload CV'er</h2>
        <p className="text-gray-600 mb-8">Upload op til 50 CV'er (PDF). Hvis der er mere end 10, analyseres de i batches automatisk.</p>

        <label className="w-full">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
            <FileText className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-lg font-medium text-gray-900">{count > 0 ? `${count} fil(er) valgt` : 'Klik for at vælge CV\'er'}</p>
            <p className="text-gray-500 text-sm mt-1">Flere PDF-filer kan vælges samtidigt</p>
          </div>
          <input type="file" accept=".pdf" multiple onChange={onChange} className="hidden" />
        </label>

        <Button className="mt-8 px-8 py-6 text-lg" onClick={onAnalyze} disabled={count === 0}>
          Analyser CV'er
        </Button>
      </div>
    </div>
  )
}
