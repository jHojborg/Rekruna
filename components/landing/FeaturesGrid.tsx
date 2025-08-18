import { Upload, Brain, ListOrdered, FileText, Globe, Shield, Save, LandPlot, HandCoinsIcon } from 'lucide-react'
import { IconBadge } from '@/components/shared/IconBadge'

interface Feature {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

export function FeaturesGrid() {
  const features: Feature[] = [
    {
      icon: HandCoinsIcon,
      title: "Reducer omkostningerne",
      description: "Med Rekruna som den interne CV-screener spares både tid og penge i rekruteringsprocessen"
    },
    {
      icon: Brain,
      title: "Brugervenlig proces", 
      description: "Upload stillingsopslag og CV´r. Vælg de vigtigste krav – så klarer systemet resten."
    },
    {
      icon: ListOrdered,
      title: "Detaljeret rapport",
      description: "Download PDF rapport med prioriteret score og kommentarer for hver kandidat."
    },
    {
      icon: FileText,
      title: "GDPR-sikkerhed som standard",
      description: "Alle data håndteres og opbevares sikkert i EU – og slettes automatisk efter 30 dage."
    },
    {
      icon: Globe,
      title: "En løsning for alle",
      description: "Rekruna er for alle. Samme hurtige analyse og prioritering, uanset antal CV´r og stillingsopslag."
    },
    {
      icon: LandPlot,
      title: "Stærkt beslutningsgrundlag",
      description: "Med Rekruna CV-screener og analyse opnås et stærkt beslutningsgrundlag til den videre proces."
    }
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Effektivt og hurtig proces til screening af kandidater.
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Alt hvad du har brug for til effektivt at screene kandidater og opnå bedste beslutningsgrundlag til den videre proces.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100"
            >
              <div className="flex items-center gap-4 mb-4">
                <IconBadge Icon={feature.icon} size="md" />
                <h3 className="text-xl font-semibold text-gray-900">
                  {feature.title}
                </h3>
              </div>
              
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
        
      </div>
    </section>
  )
} 