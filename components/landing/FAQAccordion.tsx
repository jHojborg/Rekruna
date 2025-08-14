'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FAQItem {
  question: string
  answer: string
}

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqItems: FAQItem[] = [
    {
      question: "Hvor mange CV'er må jeg analysere?",
      answer: "Du kan analysere op til 50 CV'er pr. stillingsopslag. Med Pro planen har du ubegrænset antal analyser pr. måned."
    },
    {
      question: "Hvilke filformater understøttes?",
      answer: "Vi understøtter PDF-filer for både jobopslag og CV'er. Vi arbejder på at tilføje support for Word-dokumenter og LinkedIn profiler."
    },
    {
      question: "Hvor præcis er AI-vurderingen?",
      answer: "Vores AI er trænet på tusindvis af CV'er og giver konsistente, objektive vurderinger baseret på dine specifikke krav. Nøjagtigheden forbedres konstant gennem machine learning."
    },
    {
      question: "Hvordan håndteres mine data?",
      answer: "Vi er GDPR compliant og sletter automatisk alle CV'er efter 30 dage. Dine data krypteres og behandles sikkert i henhold til danske og europæiske databeskyttelsesregler."
    },
    {
      question: "Kan jeg opsige når som helst?",
      answer: "Ja, du kan opsige dit abonnement når som helst uden binding. Du beholder adgang til dine eksisterende analyser indtil perioden udløber."
    }
  ]

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ofte stillede spørgsmål
          </h2>
          <p className="text-xl text-gray-600">
            Find svar på de mest almindelige spørgsmål om Rekruna
          </p>
        </div>

        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <div 
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                className="flex justify-between items-center w-full text-left p-6 hover:bg-gray-50 transition-colors"
                onClick={() => toggleOpen(index)}
              >
                <span className="text-lg font-medium text-gray-900">
                  {item.question}
                </span>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                />
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-6">
                  <p className="text-gray-600 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Har du andre spørgsmål? Vi hjælper gerne!
          </p>
          <Button 
            variant="outline"
            className="font-medium"
          >
            Kontakt support
          </Button>
        </div>
      </div>
    </section>
  )
} 