"use client"

import { Button } from '@/components/ui/button'

interface RequirementSelectorProps {
  requirements: { id: string; text: string; selected: boolean }[]
  onToggle: (id: string) => void
  onContinue: () => void
}

export function RequirementSelector({ requirements, onToggle, onContinue }: RequirementSelectorProps) {
  const selected = requirements.filter(r => r.selected).length
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Vælg &quot;Must-Have&quot; krav</h2>
      <p className="text-center text-gray-600 mb-6">Rekruna har vurderet disse krav, som ufravigelige. Vælg de 3 vigtigste krav som kandidaten skal opfylde.</p>

      <div className="space-y-3 mb-6">
        {requirements.map(r => {
          const disabled = !r.selected && selected >= 3
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
              <input type="checkbox" checked={r.selected} readOnly disabled={disabled} className="mt-1 h-4 w-4" />
              <span className="text-gray-900">
                {r.text}
              </span>
            </label>
          )
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-l text-gray-600">Valgt: {selected}/3 krav</p>
        <Button onClick={onContinue} disabled={selected !== 3}>Fortsæt</Button>
      </div>
    </div>
  )
}
