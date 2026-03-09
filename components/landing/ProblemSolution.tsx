import { Clock, Target, BarChart3, HeartHandshakeIcon, HandCoins, ListOrdered } from 'lucide-react'
import { IconBadge } from '@/components/shared/IconBadge'

export function ProblemSolution() {
  const items = [
    {
      icon: ListOrdered,
      title: 'Objektiv vurdering',
      description:
        'Du får en en kompetancebaseret og objektiv vurdering af alle ansøgere -  uden subjektive antagelser.'
    },{
      icon: HandCoins,
      title: 'Mere tid til møder',
      description:
        'Du sparer både tid og penge i screeningsfasen. Mere tid til at møde og evaluere ansøgerne.'
    },
    {
      icon: HeartHandshakeIcon,
      title: 'Ingen opstartsgebyr',
      description:
        'Ingen opstartsfee eller andre ekstraomkostninger - Du betaler kun for aktive stillingsopslag.'
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
      description: 'Den prioriterede ansøgerliste er et stærkt vurderingsgrundlag for det videre forløb.'
    },
    {
      icon: BarChart3,
      title: 'AI ACT & GDPR compliant',
      description: 'Alle data håndteres efter gældende AI ACT og GDPR regler.'
    }
  ]

  return (
    <section className="pt-25 pb-12 bg-brand-softGrey">
      {/* pt-25: top padding uændret. pb-12: bund-padding halveret (fra 6.25rem til 3rem) for at reducere afstand til DemoContactForm med 50% */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Øverste sektion: centralt headline + intro-tekst */}
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Hvorfor vælge Rekruna?
          </h2>
          <p className="mt-8 text-xl text-gray-700">
          Enhver rekrutteringsansvarlig ved, hvor tidskrævende en grundig CV-gennemgang er. Rekruna løser den tunge CV-screening og sikrer, at ingen ansøgere bliver overset. Imens kan du bruge tiden på det, kun du kan – samtaler, vurderinger og menneskelig rela tion med ansøgeren.
          </p>
        </div>

        {/* USP-kort: 3 rækker × 2 kolonner på bred skærm, 1 kolonne på mobile */}
        <div className="mt-32 grid grid-cols-1 lg:grid-cols-2 gap-8">
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