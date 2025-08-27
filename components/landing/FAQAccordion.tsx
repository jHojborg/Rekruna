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
      question: "Hvor mange CV'r må jeg analysere?",
      answer: "Der er ikke loft over hvor mange CV´r du kan uploade, men har du mere end 50 CV´r, bliver de uploaded i puljer af 50 stk. pr. gang."
    },
    {
      question: "Hvilke filformater understøttes?",
      answer: "Vi understøtter PDF-filer for både jobopslag og CV´r. Vi arbejder på at tilføje support for andre formaler."
    },
    {
      question: "Hvor præcis er AI-vurderingen?",
      answer: "Vores AI-model giver en konsistent, objektiv vurdering baseret på dine specifikke krav. Og med 10 point skalaen får du en granuleret feedback på alle kandidater. "
    },
    {
      question: "Hvordan håndteres mine data?",
      answer: "Alle data lagres indenfor EUs grænser iht gældende regler, og bliver automatisk efter 30 dage. Data du har downloaded har du selv ansavr for. "
    },
    {
      question: "Kan jeg opsige når som helst?",
      answer: "Ja, du kan opsige dit abonnement når som helst med løbende + dage 30. Du kan naturligvis benytte systemet i hele opsigelsesperioden."
    }
  ]

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-20 bg-brand-base">
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
            Kontakt os
          </Button>
        </div>
      </div>
    </section>
  )
} 