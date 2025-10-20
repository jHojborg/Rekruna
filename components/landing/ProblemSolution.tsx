import { Clock, Target, BarChart3, HeartHandshakeIcon, HandCoins, ListOrdered } from 'lucide-react'
import { IconBadge } from '@/components/shared/IconBadge'

export function ProblemSolution() {
  const items = [
    {
      icon: ListOrdered,
      title: 'Objektiv vurdering',
      description:
        'Rekruna sikrer en objektiv og kompetancebaseret vurdering af alle ansøgere -  uden subjektive antagelser.'
    },{
      icon: HandCoins,
      title: 'Mere tid til møder',
      description:
        'Med Rekruna sparer du både tid og penge i screeningsfasen. Mere tid til at møde og evaluere ansøgerne.'
    },
    {
      icon: HeartHandshakeIcon,
      title: 'Ingen opstartsgebyr',
      description:
        'Du betaler kun en fast månedlige ydelse. Ingen opstartsfee eller andre ekstraomkostninger.'
    },
    {
      icon: Clock,
      title: 'Brugervenligt og intuitivt',
      description:
        'Upload stillingsopslag og CV’er - så klarer Rekruna resten på få minutter.'
    },
  
    {
      icon: Target,
      title: 'Stærkt vurderingsgrundlag',
      description: 'Med den prioriterede ansøgerliste, med kommentarer, har du et stærkt vurderingsgrundlag til den videre evaluering.'
    },
    {
      icon: BarChart3,
      title: 'AI ACT & GDPR compliant',
      description: 'Alle data håndteres efter gældende AI ACT og GDPR lovgivning.'
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
          Enhver rekrutteringsansvarlig ved, hvor tidskrævende en grundig CV-gennemgang er. Rekruna analyserer alle CV´r objektivt, og sikrer, at ingen ansøgere bliver overses. Den prioriterede  ansøgerliste fungere som støtte til vurdering i møder og evaluering af ansøgere.
          </p>
        </div>

        {/* USP-kort i 3x2 grid som i illustrationen (hvidt kortdesign) */}
        <div className="mt-32 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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