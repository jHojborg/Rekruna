import { Clock, Target, BarChart3, HeartHandshakeIcon, HandCoins, ListOrdered } from 'lucide-react'
import { IconBadge } from '@/components/shared/IconBadge'

export function ProblemSolution() {
  const items = [
    {
      icon: HandCoins,
      title: 'Ubegrænset analyser',
      description:
        'Vi tilbyder én pris med alt inklusiv, så du kan screene ubegrænset antal CV´r.'
    },
    {
      icon: HeartHandshakeIcon,
      title: 'Objektiv vurdering uden bias',
      description:
        'Med vores AI scoringsmodel sikres du en neutral, ensartet og retfærdig evaluering.'
    },
    {
      icon: ListOrdered,
      title: 'Prioriteret best-match liste',
      description:
        'Alle CV´r rangeres på en 10-skala med detaljeret begrundelse for placeringen.'
    },
    {
      icon: Clock,
      title: 'Reduceret tidsforbrug',
      description:
        'Analysér alle CV´r op til 80 % hurtigere så du straks kan se, hvem der bedst matcher jobbet. '
    },
    // NYE USP-KORT (midlertidig tekst – opdateres senere)
    {
      icon: Target,
      title: 'Automatisk matching',
      description: 'Lirum larum pladsholdertekst der beskriver automatisk matching. Opdateres senere.'
    },
    {
      icon: BarChart3,
      title: 'Avanceret søgning',
      description: 'Lirum larum pladsholdertekst for avanceret søgning og filtrering. Opdateres senere.'
    }
  ]

  return (
    <section className="py-24 bg-brand-softGrey">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Øverste sektion: centralt headline + intro-tekst */}
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Hvorfor vælge Rekruna?
          </h2>
          <p className="mt-8 text-xl text-gray-700">
            Rekruna er udviklet til dig, der har rekrutteringsansvar og ønsker en hurtig og objektiv vurdering af alle ansøgninger ift. dine jobkrav. Vores AI-baserede system analyserer alle kandidater, scorer dem ud fra et detaljeret vurderingssystem og giver dig en prioriteret liste med konkrete kommentarer – så du straks kan se, hvem der bedst matcher jobbet.
          </p>
        </div>

        {/* USP-kort i 3x2 grid som i illustrationen (hvidt kortdesign) */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
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