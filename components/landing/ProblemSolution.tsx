import { Clock, Target, BarChart3, DollarSign, HeartHandshakeIcon, HandCoins, ListOrdered } from 'lucide-react'
import { IconBadge } from '@/components/shared/IconBadge'

export function ProblemSolution() {
  const items = [
    {
      icon: Clock,
      title: 'Reduceret tidsforbrug',
      description:
        'Analysér alle CV´r op til 80 % hurtigere så du straks kan se, hvem der bedst matcher jobbet.'
    },
    {
      icon: HeartHandshakeIcon,
      title: 'Objektiv vurdering uden bias',
      description:
        'Med vores AI-drevet scoringsmodel sikres du en neutral, ensartet og retfærdig evaluering.'
    },
    {
      icon: ListOrdered,
      title: 'Prioriteret best-match liste',
      description:
        'Alle CV´r rangeres på en 10 skala med detaljeret begrundelse for placeringen.'
    },
    {
      icon: HandCoins,
      title: 'Ubegrænset analyser',
      description:
        'Vi tilbyder én pris med alt inklusiv, så du kan screene ubegrænset antal CV´r.'
    }
  ]

  return (
    <section className="py-24 bg-brand-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left: Heading + intro */}
          <div>
            <h2 className="text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
              Hvorfor vælge
              <br />
              Rekruna?
            </h2>
            <p className="mt-8 text-xl text-gray-700 max-w-2xl">
            Rekruna er udviklet til dig, der har rekrutteringsansvar og ønsker en hurtig, præcis og objektiv vurdering af alle ansøgninger op mod dine jobkrav. Vores AI-baserede system analyserer alle kandidater, scorer dem ud fra et detaljeret vurderingssystem og giver dig en prioriteret liste med konkrete kommentarer – så du straks kan se, hvem der bedst matcher jobbet..
            </p>
          </div>

          {/* Right: 2x2 grid of value points */}
          <div className="grid sm:grid-cols-2 gap-12">
            {items.map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center gap-5 mb-2">
                  <IconBadge Icon={item.icon} size="md" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    {item.title}
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 