"use client"

import { Upload, FileText, X, CheckCircle2, FileCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { validateJobPdf } from '@/lib/pdf/validation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface JobTemplate {
  id: string
  title: string
  description: string | null
  job_file_name: string | null
  requirements: any[]
  usage_count: number
  last_used_at: string | null
  created_at: string
}

interface JobUploadCardProps {
  file: File | null
  onFileSelected: (file: File) => void
  onStart: () => void
  onTemplateSelected: (template: JobTemplate) => void
  canStart: boolean
}

export function JobUploadCard({ file, onFileSelected, onStart, onTemplateSelected, canStart }: JobUploadCardProps) {
  const [validating, setValidating] = useState(false)
  const [templates, setTemplates] = useState<JobTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  // Load templates on mount
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/templates', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const data = await response.json()
      if (data.ok && data.templates) {
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleTemplateSelect = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (!template) return

    // Track usage
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await fetch(`/api/templates/${templateId}/use`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
      }
    } catch (error) {
      console.warn('Failed to track template usage:', error)
    }

    // Notify parent
    onTemplateSelected(template)
  }

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return

    // Check file extension
    if (!/\.pdf$/i.test(f.name)) {
      alert('Kun PDF-filer er tilladt.')
      return
    }

    // Validate PDF quality
    setValidating(true)
    try {
      const validation = await validateJobPdf(f)
      if (!validation.valid) {
        alert(validation.error)
        return
      }
      onFileSelected(f)
    } catch (error) {
      alert('Kunne ikke validere PDF. Prøv igen.')
    } finally {
      setValidating(false)
    }
  }

  const removeFile = () => {
    onFileSelected(null as any)
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">(1) Upload Stillingsbeskrivelsen</h2>
        <p className="text-gray-600 mb-6">Upload stillingsbeskrivelsen som PDF og klik Start analyse</p>

        {validating ? (
          // Validating state
          <div className="w-full">
            <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-10 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-lg font-medium text-gray-900">Validerer PDF...</p>
              <p className="text-gray-500 text-sm mt-1">Tjekker kvalitet og læsbarhed</p>
            </div>
          </div>
        ) : !file ? (
          // Upload area when no file selected - NOW FIRST
          <label className="w-full cursor-pointer">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 flex flex-col items-center justify-center hover:bg-gray-50 transition">
              <FileText className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-lg font-medium text-gray-900">Klik for at vælge fil</p>
              <p className="text-gray-500 text-sm mt-1">Kun PDF-filer accepteres</p>
            </div>
            <input type="file" accept=".pdf" onChange={onChange} className="hidden" disabled={validating} />
          </label>
        ) : (
          // File preview when file is selected
          <div className="w-full space-y-4">
            {/* Header with file info */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-gray-900">Fil valgt</span>
              </div>
            </div>

            {/* File preview card */}
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={removeFile}
                  className="flex-shrink-0 p-1 hover:bg-red-100 rounded-full transition-colors group"
                  title="Fjern fil"
                >
                  <X className="h-4 w-4 text-gray-400 group-hover:text-red-600" />
                </button>
              </div>
            </div>

            {/* Change file button */}
            <label className="inline-block cursor-pointer">
              <div className="text-sm text-primary hover:text-primary/80 underline flex items-center gap-1 justify-center">
                <Upload className="h-4 w-4" />
                Vælg en anden fil
              </div>
              <input type="file" accept=".pdf" onChange={onChange} className="hidden" />
            </label>
          </div>
        )}

        {/* Divider - only show when templates exist and no file */}
        {templates.length > 0 && !file && (
          <div className="w-full flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-sm text-gray-500 font-medium">ELLER</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>
        )}

        {/* Template Selector - NOW SECOND (AFTER upload) */}
        {templates.length > 0 && !file && (
          <div className="w-full mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck className="h-5 w-5 text-blue-600" />
              <label className="text-sm font-medium text-gray-700">
                Brug en tidligere template:
              </label>
            </div>
            <select
              onChange={(e) => e.target.value && handleTemplateSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              defaultValue=""
              disabled={loadingTemplates}
            >
              <option value="">Vælg template...</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title}
                  {template.usage_count > 0 && ` (brugt ${template.usage_count} ${template.usage_count === 1 ? 'gang' : 'gange'})`}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Templaten indeholder gemte krav fra tidligere analyse
            </p>
          </div>
        )}

        <Button className="mt-2 px-8 py-6 text-lg" onClick={onStart} disabled={!canStart || validating}>
          Start Analyse
        </Button>
      </div>
    </div>
  )
}
