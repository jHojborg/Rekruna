"use client"

import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { useState } from 'react'

interface SaveTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (title: string, description: string) => Promise<void>
  jobFileName?: string
}

export function SaveTemplateModal({ isOpen, onClose, onSave, jobFileName }: SaveTemplateModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  // Reset form when modal closes
  const handleClose = () => {
    setTitle('')
    setDescription('')
    onClose()
  }

  const handleSave = async () => {
    if (title.trim().length < 3) {
      alert('Titel skal være mindst 3 tegn.')
      return
    }

    setSaving(true)
    try {
      await onSave(title.trim(), description.trim())
      handleClose()
    } catch (error) {
      console.error('Failed to save template:', error)
      alert('Kunne ikke gemme template. Prøv igen.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Gem som template</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            disabled={saving}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Job file info */}
        {jobFileName && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Jobopslag: <span className="font-medium text-gray-900">{jobFileName}</span>
            </p>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template navn <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Fx: Senior React Developer"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={saving}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">Navn på stillingen (vises i dropdown)</p>
          </div>

          {/* Description (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Beskrivelse (valgfri)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Fx: Tech lead til vores frontend team"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
              disabled={saving}
            />
            <p className="text-xs text-gray-500 mt-1">Ekstra noter om stillingen</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={saving}
            className="flex-1"
          >
            Annuller
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || title.trim().length < 3}
            className="flex-1"
          >
            {saving ? 'Gemmer...' : 'Gem template'}
          </Button>
        </div>

        {/* Info */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Templaten kan genbruges til fremtidige analyser med samme krav
        </p>
      </div>
    </div>
  )
}



