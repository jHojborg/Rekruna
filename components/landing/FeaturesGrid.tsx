import { Upload, Brain, ListOrdered, FileText, Globe, Shield } from 'lucide-react'
import { IconBadge } from '@/components/shared/IconBadge'

interface Feature {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

export function FeaturesGrid() {
  const features: Feature[] = [
    {
      icon: Upload,
      title: "Upload & Analyser",
      description: "Upload jobopslag og op til 50 CV'er. Simpel drag-and-drop interface gør processen hurtig og intuitiv."
    },
    {
      icon: Brain,
      title: "AI-drevet Scoring", 
      description: "Præcis vurdering med GPT-4o-mini teknologi. Konsistent og objektiv evaluering af hver kandidat."
    },
    {
      icon: ListOrdered,
      title: "Prioriteret Liste",
      description: "Få kandidater rangeret efter match med 0-10 skala. Se straks hvem der bedst opfylder dine krav."
    },
    {
      icon: FileText,
      title: "Detaljeret Rapport",
      description: "Download PDF med begrundelser for hver score. Del nemt resultater med dit team."
    },
    {
      icon: Globe,
      title: "Dansk Sprog",
      description: "Fuld support for danske CV'er og jobopslag. AI forstår dansk kontekst og terminologi."
    },
    {
      icon: Shield,
      title: "GDPR Compliant",
      description: "Sikker håndtering af persondata med automatisk sletning efter 30 dage. Fuld GDPR compliance."
    }
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Kraftfulde funktioner til moderne rekruttering
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Alt hvad du har brug for til at strømline din rekrutteringsproces og træffe bedre ansættelsesbeslutninger
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