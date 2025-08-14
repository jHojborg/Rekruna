import { cn } from '@/lib/utils'

interface AnalysisProgressProps {
  currentStep: 1 | 2 | 3 | 4
}

const steps = [1, 2, 3, 4] as const

export function AnalysisProgress({ currentStep }: AnalysisProgressProps) {
  return (
    <div className="w-full bg-brand-base border-b border-gray-200 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-4">
              <div
                className={cn(
                  'h-12 w-12 rounded-full flex items-center justify-center text-base font-semibold',
                  s <= currentStep ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                )}
              >
                {s}
              </div>
              {i < steps.length - 1 && (
                <div className={cn('h-1 w-16 rounded', s < currentStep ? 'bg-primary' : 'bg-gray-200')} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
