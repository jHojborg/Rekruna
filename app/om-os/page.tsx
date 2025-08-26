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
            Rekruttering handler om mennesker – og det gør vi også.
          </h1>

          <div className="prose prose-lg max-w-none text-gray-700">
            {/* Afsnit 1: Problemet og konteksten */}
            <p>
              Idéen til Rekruna opstod, da medstifter Jan Højborg Henriksen, med mere end 25 års erhvervserfaring og mange gennemførte rekrutteringsforløb, stod over for endnu en ny ansættelsesrunde. At finde den rette kandidat kræver normalt, at hvert CV og hver ansøgning læses grundigt igennem, evalueres og prioriteres – en proces, der ofte indebærer 50, 100 eller endnu flere dokumenter. Uanset om kandidaterne findes i ansøgerfeltet eller opspores via eksempelvis LinkedIn, er fællesnævneren den samme: det er både tids- og ressourcekrævende.
            </p>
            {/* Afsnit 2: Behovet og målet om fairness/effektivitet */}
            <p>
              Netop de mange gennemgange af CV’er, analyser af kandidater og interviews, for til sidst at byde nye medarbejdere velkommen, gjorde behovet tydeligt: der måtte findes en smartere måde at skabe både højere effektivitet og større fairness i den indledende screening.
            </p>
            {/* Afsnit 3: Løsningens start og udvikling */}
            <p>
              Det blev startskuddet til Rekruna. Hvad der begyndte som en lille specialbygget GPT, er i dag vokset til en professionel AI-løsning, der kombinerer hurtighed, grundighed og gennemsigtighed.
            </p>
            {/* Afsnit 4: Hvad AI-motoren gør for brugeren */}
            <p>
              Rekrunas AI-motor analyserer ansøgninger og CV’er på få minutter, matcher kompetencer med virksomhedens krav og leverer en prioriteret kandidatliste, som gør det enkelt for den rekrutteringsansvarlige at vælge de rette kandidater til næste trin i processen.
            </p>
            {/* Afsnit 5: Slutnote med fokus på mennesket */}
            <p>
              Så enkelt og effektivt som det lyder – og altid med mennesket i centrum.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}


