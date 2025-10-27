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
      question: "Hvordan håndteres mine data?",
      answer: "Vi tager vores datasikkerhedsansvar alvorligt og behandler data i fuld overensstemmelse med gældende EU-lovgivning. Alle data lagres sikkert inden for EU’s grænser. CV-oplysninger anonymiseres, før AI-modellen modtager dem – der videregives ingen personhenførbare data. CV’er og analyseresultater opbevares i en separat database og slettes automatisk efter 30 dage. Rekruna er compliant med EU’s AI Act og GDPR. Vi overvåger løbende lovgivningen og opdaterer systemet for at sikre fortsat compliance og maksimal datasikkerhed. Husk at du som bruger er du selv ansvarlig for den endelige anvendelse af analyser og resultater, der downloades fra systemet."
    },
    {
      question: "Hvad betyder credits?",
      answer: "En credit er lig med et CV. Dvs. hvis du vil screene 10 CV´r bruger du 10 credits. Eller hvis du screener fx tre pulje af ti CVér (30 ialt) og herfter screener på tværs af de tre screening resultater, har du brugt 60 credits"
    },
    {
      question: "Kan man lave løbende sammenligninger?",
      answer: "Ja - i takt med at du modtager ansøgninger, kan du løbende gennemføre CV-screeninger. Når alle ansøgninger er modtaget, kan du foretage en samlet analyse på tværs af de tidligere screeninger."
    },
    {
      question: "Hvor mange CV'r må jeg analysere?",
      answer: "Der er ikke loft over hvor mange CV´r du kan uploade, men har du mere end 50 CV´r, bliver de uploaded i puljer af 50 stk. pr. gang. Det påvirker ikke det samlede analyseresultat"
    },
    {
      question: "Hvilke filformater understøttes?",
      answer: "Vi understøtter pt. kun upload af PDF-filer. Men der arbejdes på at tilføje support for andre formater."
    },
    {
      question: "Hvor præcis er AI-vurderingen?",
      answer: "Vores test viser at vurderingerne er meget konsistente og objektive. Med 10 point skalaen får du en granuleret feedback på alle CV´r. Den måde vi anonymiserer CVérne sikre tillige en bias-fri analyse."
    },
    {
      question: "Kan jeg opsige når som helst?",
      answer: "Ja absolut, abonnementerne Pro og Business kan opsiges med løbende mdr. + dage 30. Du kan naturligvis benytte systemet i hele opsigelsesperioden."
    }
  ]

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-25 bg-brand-base">
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
      </div>
    </section>
  )
} 