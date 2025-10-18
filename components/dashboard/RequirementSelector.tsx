"use client"

import { Button } from '@/components/ui/button'
import { Plus, X, Save } from 'lucide-react'
import { useState } from 'react'

interface RequirementSelectorProps {
  requirements: { id: string; text: string; selected: boolean; isCustom?: boolean }[]
  onToggle: (id: string) => void
  onContinue: () => void
  onBack: () => void
  onAddCustom: (text: string) => void
  onRemoveCustom: (id: string) => void
  onSaveTemplate?: () => void
  showSaveTemplate?: boolean
}

export function RequirementSelector({ 
  requirements, 
  onToggle, 
  onContinue, 
  onBack,
  onAddCustom,
  onRemoveCustom,
  onSaveTemplate,
  showSaveTemplate = true
}: RequirementSelectorProps) {
  const [customText, setCustomText] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  
  const selected = requirements.filter(r => r.selected).length
  const MIN_REQUIREMENTS = 2
  const MAX_REQUIREMENTS = 5
  
  // If no AI-generated requirements, show custom input by default
  const hasAIRequirements = requirements.some(r => !r.isCustom)
  const showInputByDefault = !hasAIRequirements && requirements.length === 0

  const handleAddCustom = () => {
    if (customText.trim().length < 5) {
      alert('Krav skal være mindst 5 tegn langt.')
      return
    }
    onAddCustom(customText.trim())
    setCustomText('')
    setShowCustomInput(false)
  }

  const handleRemoveCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onRemoveCustom(id)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
        {hasAIRequirements ? 'Vælg "Must-Have" krav' : 'Skriv dine "Must-Have" krav'}
      </h2>
      <p className="text-center text-gray-600 mb-6">
        {hasAIRequirements 
          ? `Rekruna har fundet ${requirements.filter(r => !r.isCustom).length} krav. Vælg ${MIN_REQUIREMENTS}-${MAX_REQUIREMENTS} vigtigste krav, eller tilføj dine egne.`
          : `Rekruna kunne ikke finde krav automatisk. Skriv ${MIN_REQUIREMENTS}-${MAX_REQUIREMENTS} vigtigste krav som kandidaten skal opfylde.`
        }
      </p>

      {/* List of requirements (AI + custom) */}
      <div className="space-y-3 mb-4">
        {requirements.map(r => {
          const disabled = !r.selected && selected >= MAX_REQUIREMENTS
          return (
            <label
              key={r.id}
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition ${
                r.selected
                  ? 'border-primary bg-primary/5'
                  : disabled
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={(e) => {
                e.preventDefault()
                if (disabled) return
                onToggle(r.id)
              }}
            >
              <input 
                type="checkbox" 
                checked={r.selected} 
                readOnly 
                disabled={disabled} 
                className="mt-1 h-4 w-4 flex-shrink-0" 
              />
              <span className="text-gray-900 flex-1">
                {r.text}
                {r.isCustom && <span className="text-xs text-gray-500 ml-2">(Dit eget krav)</span>}
              </span>
              {r.isCustom && (
                <button
                  onClick={(e) => handleRemoveCustom(r.id, e)}
                  className="flex-shrink-0 p-1 hover:bg-red-100 rounded-full transition-colors group"
                  title="Fjern krav"
                >
                  <X className="h-4 w-4 text-gray-400 group-hover:text-red-600" />
                </button>
              )}
            </label>
          )
        })}
      </div>

      {/* Add custom requirement */}
      {(showCustomInput || showInputByDefault) ? (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tilføj dit eget krav:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCustom()}
              placeholder="Fx: 5+ års erfaring med React"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <Button onClick={handleAddCustom} disabled={customText.trim().length < 5}>
              Tilføj
            </Button>
            {!showInputByDefault && (
              <Button variant="outline" onClick={() => { setShowCustomInput(false); setCustomText('') }}>
                Annuller
              </Button>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCustomInput(true)}
          className="w-full mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-primary"
        >
          <Plus className="h-5 w-5" />
          <span>Tilføj dit eget krav</span>
        </button>
      )}

      {/* Footer with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline">← Tilbage</Button>
          <p className="text-l text-gray-600">
            Valgt: {selected} {selected === 1 ? 'krav' : 'krav'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Save as Template Button */}
          {showSaveTemplate && onSaveTemplate && selected >= MIN_REQUIREMENTS && (
            <Button 
              onClick={onSaveTemplate}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Gem som template
            </Button>
          )}
          {/* Continue Button */}
          <Button 
            onClick={onContinue} 
            disabled={selected < MIN_REQUIREMENTS || selected > MAX_REQUIREMENTS}
          >
            Fortsæt
          </Button>
        </div>
      </div>
    </div>
  )
}
