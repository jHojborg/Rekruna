// Om os (About us) side for Rekruna
// Denne side forklarer historien og værdierne bag produktet.
// Vi bruger en simpel, læsbar struktur med Tailwind-klasser,
// som matcher den eksisterende stil i landing pages.
// Kommentarer er tilføjet for at gøre koden nem at forstå og vedligeholde.
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Om os – Rekruna',
  description: 'Lær historien bag Rekruna og vores menneskecentrerede tilgang til rekruttering.',
}

export default function OmOsPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Overskrift med tydelig tone-of-voice */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Om Rekruna
          </h1>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Rekruttering handler om mennesker – det gør vi også.
          </h2>

          <div className="prose prose-lg max-w-none text-gray-700">
            {/* Afsnit 1 */}
            <p>
            Idéen til Rekruna opstod, da medstifter Jan Højborg Henriksen – med over 25 års erhvervserfaring og mange gennemførte rekrutteringsforløb – endnu en gang stod over for en ny ansættelserunde. At finde de rette kandidater i et stort ansøgerfelt er en krævende opgave: hver ansøgning og CV skal vurderes, sammenlignes og prioriteres løbende. I praksis kan det betyde gennemgang af 75, 100 eller endnu flere dokumenter – en opgave, som kræver både skarp opmærksomhed og evnen til konstant at re-vurdere feltet.
            </p>
            {/* Afsnit 2 */}
            <p>
            Uanset om kandidaterne findes i ansøgerfeltet eller bliver opsporet via platforme som LinkedIn, er udgangspunktet det samme: processen er tids- og ressourcekrævende. Og der er risiko for at kvaliteten lider, fordi omfang og tidsforbrug ikke står mål med dagligdagens travlhed.
            </p>
            {/* Afsnit 3 */}
            <p>
            Det behov – at kombinere hastighed med grundighed og fairness – blev katalysatoren for Rekruna. Det, der startede som et lille skræddersyet GPT-projekt sat op på en formiddag, er i dag udviklet til en professionel AI-løsning, hvor transparens, pålidelighed og menneskefokus går hånd i hånd.
            </p>
            {/* Afsnit 4 */}
            <p>Med Rekruna’s AI-model kan du:
Analysere hundredevis af ansøgninger og CV’er på få minutter.
Matche kompetencer med virksomhedens krav.
Få en prioriteret kandidatliste uden subjektive antagelser.
Præsentere et stærkt beslutningsgrundlag til næste fase.
Alt dette sker i baggrunden, mens du bevarer kontrollen — og altid med mennesket i centrum.

            </p>
            {/* Afsnit 5 */}
            <p>Vores løfte til dig
Du skal bruge din tid på det, som kun du kan – valg, samtaler, vurdering og menneskelig interaktion. Rekruna tager sig af den tunge screening, reducerer risikoen for fejl og giver dig ro og præcision i processen.
Det er ikke blot teknologi — det er et værktøj, udviklet af rekrutteringsfolk for rekrutteringsfolk, en løsning du kan stole på.
Velkommen til Rekruna — hvor mennesker og AI arbejder sammen for at finde de rette kandidater.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}


