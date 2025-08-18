"use client"

import { Upload, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface JobUploadCardProps {
  fileName?: string
  onFileSelected: (file: File) => void
  onStart: () => void
  canStart: boolean
}

export function JobUploadCard({ fileName, onFileSelected, onStart, canStart }: JobUploadCardProps) {
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) onFileSelected(f)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="flex flex-col items-center text-center">
        <Upload className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Stillingsbeskrivelse</h2>
        <p className="text-gray-600 mb-8">Upload en PDF-fil med stillingsbeskrivelsen og klik Start analyse</p>

        <label className="w-full">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
            <FileText className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-lg font-medium text-gray-900">{fileName || 'Klik for at vælge fil'}</p>
            <p className="text-gray-500 text-sm mt-1">Kun PDF-filer accepteres</p>
          </div>
          <input type="file" accept=".pdf" onChange={onChange} className="hidden" />
        </label>

        <Button className="mt-8 px-8 py-6 text-lg" onClick={onStart} disabled={!canStart}>
          Start Analyse
        </Button>
      </div>
    </div>
  )
}
