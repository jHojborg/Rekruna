// Om os (About us) side for Rekruna
// Denne side forklarer historien og værdierne bag produktet.
// Vi bruger samme design system som resten af landing pages med
// proper sections, spacing og visuell hierarki.
// Kommentarer er tilføjet for at gøre koden nem at forstå og vedligeholde.
import type { Metadata } from 'next'
import { CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Om os – Rekruna',
  description: 'Lær historien bag Rekruna og vores menneskecentrerede tilgang til rekruttering.',
}

export default function OmOsPage() {
  // AI capabilities list - extracted for better structure
  const capabilities = [
    'Analysere hundredevis af ansøgninger og CV\'er på få minutter.',
    'Matche kompetencer med virksomhedens krav.',
    'Få en prioriteret kandidatliste uden subjektive antagelser.',
    'Præsentere et stærkt beslutningsgrundlag til næste fase.'
  ]

  return (
    <main className="min-h-screen bg-white">
      {/* Hero section med hovedoverskrift */}
      <section className="py-25 bg-brand-base">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 leading-tight mb-8">
              Rekruttering handler om<br /> mennesker - det gør vi også.
            </h1>
           </div>
        </div>
      </section>

      {/* Historien bag Rekruna */}
      <section className="py-25 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
              Om Rekruna
            </h2>
            
            <div className="space-y-8 text-lg text-gray-700 leading-relaxed">
              {/* Afsnit 1: Oprindelsen */}
              <p>
                Idéen til Rekruna opstod, da medstifter <strong>Jan Højborg Henriksen</strong> - med over 25 års erhvervserfaring og mange gennemførte rekrutteringsforløb – endnu en gang stod over for en ny ansættelserunde. At finde de rette kandidater i et stort ansøgerfelt er en krævende opgave: hver ansøgning og CV skal vurderes, sammenlignes og prioriteres løbende. I praksis kan det betyde gennemgang af 75, 100 eller endnu flere dokumenter – en opgave, som kræver både skarp opmærksomhed og evnen til konstant at re-vurdere feltet.
              </p>
              
              {/* Afsnit 2: Problemet */}
              <p>
                Uanset om kandidaterne findes i ansøgerfeltet eller bliver opsporet via platforme som LinkedIn, er udgangspunktet det samme: processen er tids- og ressourcekrævende. Og der er risiko for at kvaliteten lider, fordi omfang og tidsforbrug ikke står mål med dagligdagens travlhed.
              </p>
              
              {/* Afsnit 3: Løsningen */}
              <p>
                Det behov - at kombinere hastighed med grundighed og fairness - blev katalysatoren for Rekruna. Det, der startede som et lille skræddersyet GPT-projekt sat op på en formiddag, er i dag udviklet til en professionel AI-løsning, hvor transparens, pålidelighed og menneskefokus går hånd i hånd.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hvad Rekruna kan */}
      <section className="py-25 bg-brand-softGrey">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">
              Med Rekruna kan du:
            </h2>
            
            {/* Capabilities liste som kort */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {capabilities.map((capability, index) => (
                <div key={index} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[4px_6px_16px_rgba(0,0,0,0.25)]">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                    <p className="text-gray-700 leading-relaxed">{capability}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <p className="text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto">
                Alt dette sker i baggrunden, mens du bevarer kontrollen<br /> - og altid med mennesket i centrum.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vores løfte til dig */}
      <section className="py-25 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
              Vores løfte til dig
            </h2>
            
            <div className="space-y-8 text-lg text-gray-700 leading-relaxed">
              <p>
                Vi mener du skal bruge din tid på det, som kun du kan - valg, samtaler, vurdering og menneskelig interaktion. Rekruna tager sig af den tunge screening, reducerer risikoen for fejl og giver dig ro og præcision i processen.
              </p>
              
              <p>
                Det er ikke blot teknologi - det er et værktøj, udviklet af rekrutteringsfolk for rekrutteringsfolk, en løsning du kan stole på.
              </p>
              
              <p className="text-xl font-semibold text-gray-900">
                Velkommen til Rekruna - hvor mennesker og AI arbejder sammen om at finde de rette kandidater.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}


