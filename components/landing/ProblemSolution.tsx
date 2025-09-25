import { Clock, Target, BarChart3, HeartHandshakeIcon, HandCoins, ListOrdered } from 'lucide-react'
import { IconBadge } from '@/components/shared/IconBadge'

export function ProblemSolution() {
  const items = [
    {
      icon: HandCoins,
      title: 'Reducer tidsforbrug og omkostninger',
      description:
        'Med Rekruna som din interne CV-screener sparer du både tid og penge i den indledende prioritering - og kommer hurtigere frem til mødet med kandidaterne.'
    },
    {
      icon: HeartHandshakeIcon,
      title: 'Ingen opstartsgebyr',
      description:
        'Du betaler kun den månedlige ydelse, når du anvender Rekruna. Ingen opstartsfee eller andre ekstraomkostninger.'
    },
    {
      icon: ListOrdered,
      title: 'Objektiv og bias-fri vurdering',
      description:
        'Vores AI-model sikrer en ensartet og retfærdig vurdering af alle kandidater -  uden subjektive antagelser.'
    },
    {
      icon: Clock,
      title: 'Brugervenlig og intuitiv proces',
      description:
        'Upload stillingsopslag og CV’er, vælg de vigtigste kriterier - så klarer Rekruna resten på få minutter.'
    },
    {
      icon: Target,
      title: 'Detaljeret rapportering og prioriteret best-match',
      description: 'Du får en overskuelig rapport, med alle kandidater rangeret på en 10-skala med  kommentarer - et stærkt beslutningsgrundlag til næste fase.'
    },
    {
      icon: BarChart3,
      title: 'GDPR-sikkerhed',
      description: 'Alle data håndteres og lagres sikkert i EU og slettes automatisk efter 30 dage.'
    }
  ]

  return (
    <section className="py-25 bg-brand-softGrey">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Øverste sektion: centralt headline + intro-tekst */}
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Hvorfor vælge Rekruna?
          </h2>
          <p className="mt-8 text-xl text-gray-700">
          Enhver rekrutteringsansvarlig ved, hvor tidskrævende en grundig CV-gennemgang er. Rekruna frigør dig fra det tunge forarbejde og leverer en transparent, objektiv analyse, der sikrer, at ingen kvalificerede kandidater overses. Du får på få minutter en prioriteret kandidatliste, som danner et stærkt og objektivt beslutningsgrundlag. Resultatet er mere tid til at møde og evaluere de bedst egnede kandidater - og herved kortere time-to-hire.
          </p>
        </div>

        {/* USP-kort i 3x2 grid som i illustrationen (hvidt kortdesign) */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[4px_6px_16px_rgba(0,0,0,0.25)]"
            >
              <div className="flex items-center gap-4">
                <IconBadge Icon={item.icon} size="md" />
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
              </div>
              <p className="mt-3 text-gray-600 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 