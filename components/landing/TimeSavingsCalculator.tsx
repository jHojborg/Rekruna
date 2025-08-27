"use client"

import { Calculator, Clock } from 'lucide-react'
import { useState, useMemo } from 'react'
import { IconBadge } from '@/components/shared/IconBadge'

const PAGES_PER_APPLICATION = 3
const MINUTES_PER_PAGE = 1.5
const CORAL = '#FF6F61'
const SOFT_GREY = '#EDEDE7'

function formatTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const parts: string[] = []
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'time' : 'timer'}`)
  parts.push(`${minutes} ${minutes === 1 ? 'minut' : 'minutter'}`)
  return parts.join(' og ')
}

export function TimeSavingsCalculator() {
  const [applications, setApplications] = useState<number>(50)

  const totalMinutes = useMemo(
    () => applications * PAGES_PER_APPLICATION * MINUTES_PER_PAGE,
    [applications]
  )
  const displayTime = useMemo(() => formatTime(totalMinutes), [totalMinutes])
  // Calculate Rekruna processing time in seconds (2 seconds per application)
  const rekSeconds = useMemo(() => applications * 2, [applications])
  const rekSecondsLabel = useMemo(
    () => `${rekSeconds} ${rekSeconds === 1 ? 'sekund' : 'sekunder'}`,
    [rekSeconds]
  )

  return (
    <section className="py-20 bg-brand-softGrey">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="mx-auto mb-4 flex items-center justify-center">
           </div>
          <h2 className="text-4xl font-bold text-gray-900">Så meget tid kan du spare med Rekruna</h2>
          <p className="text-lg text-gray-600 mt-3">
            Beregn din tidsbesparelse ved at bruge Rekruna til at analysere og prioritere dine ansøgninger
          </p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 max-w-3xl mx-auto">
          <label className="block text-base font-semibold text-gray-900 mb-3">
            Vælg antal ansøgninger som skal analyseres: 
            <span className="ml-2 text-primary">{applications}</span>
          </label>

          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={applications}
            onChange={(e) => setApplications(Number(e.target.value))}
            className="brand-slider w-full h-3 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${CORAL} 0%, ${CORAL} ${applications}%, ${SOFT_GREY} ${applications}%, ${SOFT_GREY} 100%)`
            }}
          />

          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
          </div>

          <div className="text-center mt-8">
            {/* Main highlighted result box */}
            {applications > 0 && (
              <div className="mb-6 p-6 rounded-lg bg-gray-100 inline-block">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Rekruna analyserer alle ansøgninger på:
                </h3>
                <div className="text-4xl font-extrabold text-primary mb-4">
                  {rekSecondsLabel}
                </div>
              </div>
            )}
            
            {/* Comparison text */}
            {applications > 0 && (
              <div className="text-lg text-gray-900 mt-4">
                Uden Rekruna: {displayTime}.*
              </div>
            )}
            
            {/* Footnote */}
            {applications > 0 && (
              <div className="text-sm text-gray-600 mt-4 italic">
                *) beregnet gennemsnitlig tid til gennemlæsning, evaluering og prioritering
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Range styling (cross-browser) */}
      <style jsx>{`
        .brand-slider { 
          outline: none; 
          border-radius: 9999px;
          height: 12px;
        }
        /* WebKit */
        .brand-slider::-webkit-slider-runnable-track {
          height: 12px; border-radius: 9999px; background: transparent;
        }
        .brand-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none; height: 28px; width: 28px; 
          border-radius: 9999px; background: ${CORAL}; margin-top: -8px; 
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          border: 2px solid white;
        }
        /* Firefox */
        .brand-slider::-moz-range-track { height: 12px; border-radius: 9999px; background: transparent; }
        .brand-slider::-moz-range-progress { background-color: ${CORAL}; height: 12px; border-radius: 9999px; }
        .brand-slider::-moz-range-thumb { height: 28px; width: 28px; border: 2px solid white; border-radius: 9999px; background: ${CORAL}; box-shadow: 0 2px 6px rgba(0,0,0,0.15); }
      `}</style>
    </section>
  )
}
