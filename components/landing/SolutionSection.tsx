// SolutionSection shows a simple 3-step illustration of the product flow
// with alternating image/text blocks. Images live in /public/images.
// We keep layout minimal and consistent with other landing sections.

import Image from 'next/image'

export function SolutionSection() {
  function NumberBadge({ value }: { value: number | string }) {
    return (
      <div className="w-16 h-16 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
        <span className="text-2xl font-bold">{value}</span>
      </div>
    )
  }
  // This section is empty by design. It acts as a placeholder.
  // Add your future layout/components here when ready.
  return (
    <section className="py-25 bg-brand-base">
      {/* Section container uses the same layout as other landing blocks for consistency */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Headline and subheadline area */}
        <div className="text-center mb-12">
          {/* Headline: h2 with simple, readable styling */}
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Objektiv og grundig CV screening i 3 steps</h2>
          {/* Subheadline/description: keep the text exactly as requested */}
          <p className="text-xl text-gray-600">Med tre enkle steps har du en prioriteret kandidatliste som et stærkt beslutningsgrundlag i den videre proces.</p>
        </div>

        {/* Step 1: Image left, text right */}
        <div className="mt-20 grid md:grid-cols-2 gap-8 md:gap-12 items-center mb-14">
          {/* Visual illustration */}
          <div>
            <Image
              src="/images/upload_opslag.png"
              alt="Rekruna - Upload jobbeskrivelse"
              width={880}
              height={540}
              className="w-full h-auto rounded-xl bg-white shadow-[4px_6px_16px_rgba(0,0,0,0.25)]"
            />
          </div>

          {/* Descriptive card */}
          <div className="p-0">
            <div className="flex items-center gap-4 mb-3">
              <NumberBadge value={1} />
              <h3 className="text-2xl font-semibold text-gray-900">Upload jobbeskrivelsen</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Upload jobbeskrivelsen som PDF. Vores AI model analyserer 
              indholdet og identificerer de centrale kriterier for kandidaten.
            </p>
            <p className="mt-4 text-gray-700">➔ Hurtigt, præcist og klar til næste skridt.</p>
          </div>
        </div>

        {/* Step 2: Text left, image right */}
        <div className="mt-20 grid md:grid-cols-2 gap-8 md:gap-12 items-center mb-14">
          {/* Descriptive card */}
          <div className="p-0">
            <div className="flex items-center gap-4 mb-3">
              <NumberBadge value={2} />
              <h3 className="text-2xl font-semibold text-gray-900">Vælg de vigtigste kriterier</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Ud af de identificered centrale kriterier vælger du de tre vigtigste,
              som kandidaten skal opfylde. Upload CV’er, starte analysen og overlade resten til systemet.
            </p>
            <p className="mt-4 text-gray-700">➔ 6 sek. gns analysetid med et to-siders jobopslag.</p>
          </div>

          {/* Visual illustration */}
          <div>
            <Image
              src="/images/kriterier.png"
              alt="Rekruna - Vælg must-have kriterier"
              width={880}
              height={540}
              className="w-full h-auto rounded-xl bg-white shadow-[4px_6px_16px_rgba(0,0,0,0.25)]"
            />
          </div>
        </div>

        {/* Step 3: Image left, text right */}
        <div className="mt-20 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Visual illustration */}
          <div>
            <Image
              src="/images/analyse_resultat.png"
              alt="Analyse resultat eksempel"
              width={880}
              height={540}
              className="w-full h-auto rounded-xl bg-white shadow-[4px_6px_16px_rgba(0,0,0,0.25)]"
            />
          </div>

          {/* Descriptive card */}
          <div className="p-0">
            <div className="flex items-center gap-4 mb-3">
              <NumberBadge value={3} />
              <h3 className="text-2xl font-semibold text-gray-900">Analyseresultatet er klar</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Med fx 50 CV´r har du en prioriteret kandidatliste indenfor 60 sek. Hver kandidat får en score
              og kommentarer, så du nemt kan spotte styrker og opmærksomhedspunkter.
            </p>
            <p className="mt-4 text-gray-700">➔ 48 sek. gns. analysetid med 50 CV’er.</p>
          </div>
        </div>
      </div>
    </section>
  )
}



