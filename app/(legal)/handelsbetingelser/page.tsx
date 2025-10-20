export default function TermsPage() {
  return (
    <main className="min-h-screen bg-brand-base py-16 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Handels- og abonnementsbetingelser for Rekruna
        </h1>
        
        <div className="prose prose-lg max-w-none">
          {/* Section 1 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Parter og anvendelsesområde</h2>
            <p className="text-gray-700 mb-4">
              Disse vilkår ("Vilkår") gælder for levering af adgang til Rekruna-platformen ("Tjenesten") 
              leveret af <strong>Blue Banana Framework ApS CVR: 45676099</strong>, Kristiansminde 21, 4000 Roskilde, 
              e-mail:  til erhvervskunder ("Kunden").
            </p>
            <p className="text-gray-700">
              Rekruna er en webbaseret SaaS-løsning, der anvender kunstig intelligens til at analysere og 
              prioritere CV'er i forhold til stillingsopslag. Tjenesten fungerer som beslutningsstøtte – 
              ikke som en juridisk eller endelig rekrutteringsafgørelse.
            </p>
          </section>

          {/* Section 2 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Roller efter EU AI Act</h2>
            
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">2.1</h3>
              <p className="text-gray-700">
                Rekruna er udbyder (provider) af et højrisiko-AI-system til brug i rekrutteringsprocesser, 
                jf. EU AI Act, bilag III. Kunden er iværksætter/anvender (deployer) af systemet i egen rekruttering.
              </p>
            </div>

            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">2.2</h3>
              <p className="text-gray-700">
                Rekruna opfylder som udbyder forpligtelserne i AI Act art. 16, herunder kvalitetssystem, 
                teknisk dokumentation, logning, brugsanvisning og overvågning. Kunden opfylder som deployer 
                forpligtelserne efter AI Act art. 26, herunder human oversight, korrekt brug af systemet, 
                oplysningspligt over for berørte personer samt logning og dokumentation for anvendelsen.
              </p>
            </div>

            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">2.3</h3>
              <p className="text-gray-700">
                Kunden accepterer, at systemet alene leverer forslag og ikke afgør ansættelser. 
                Kunden bærer altid det endelige ansvar for rekrutteringsbeslutninger.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Abonnement, priser og betaling</h2>
            
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Tjenesten tilbydes i følgende pakker (ekskl. moms):</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300 mb-6">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Produkt</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Indhold</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Pris</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Rekruna One</td>
                      <td className="border border-gray-300 px-4 py-2">200 credits. Engangskøb. Ubrugte credits udløber efter 90 dage.</td>
                      <td className="border border-gray-300 px-4 py-2">499 kr.</td>
                      <td className="border border-gray-300 px-4 py-2">Engangsbetaling</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">Rekruna Pro</td>
                      <td className="border border-gray-300 px-4 py-2">400 credits pr. måned. Opsigelse: løbende måned + 30 dage.</td>
                      <td className="border border-gray-300 px-4 py-2">349 kr./md.</td>
                      <td className="border border-gray-300 px-4 py-2">Månedligt abonnement</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Rekruna Business</td>
                      <td className="border border-gray-300 px-4 py-2">1000 credits pr. måned. Opsigelse: løbende måned + 30 dage.</td>
                      <td className="border border-gray-300 px-4 py-2">699 kr./md.</td>
                      <td className="border border-gray-300 px-4 py-2">Månedligt abonnement</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">Booster 50</td>
                      <td className="border border-gray-300 px-4 py-2">+50 credits. Overføres til næste måned.</td>
                      <td className="border border-gray-300 px-4 py-2">59 kr.</td>
                      <td className="border border-gray-300 px-4 py-2">Engangsbetaling</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Booster 100</td>
                      <td className="border border-gray-300 px-4 py-2">+100 credits. Overføres til næste måned.</td>
                      <td className="border border-gray-300 px-4 py-2">99 kr.</td>
                      <td className="border border-gray-300 px-4 py-2">Engangsbetaling</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">Booster 250</td>
                      <td className="border border-gray-300 px-4 py-2">+250 credits. Overføres til næste måned.</td>
                      <td className="border border-gray-300 px-4 py-2">199 kr.</td>
                      <td className="border border-gray-300 px-4 py-2">Engangsbetaling</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Booster 500</td>
                      <td className="border border-gray-300 px-4 py-2">+500 credits. Overføres til næste måned.</td>
                      <td className="border border-gray-300 px-4 py-2">349 kr.</td>
                      <td className="border border-gray-300 px-4 py-2">Engangsbetaling</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">3.2</h3>
              <p className="text-gray-700">
                Credits anvendes pr. CV-screening hvor 1 credit = 1 CV. Kun ubrugte booster-credits kan 
                overføres til følgende måned.
              </p>
            </div>

            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">3.3</h3>
              <p className="text-gray-700">
                Betaling sker forud via Stripe online betalingsløsning, og faktura sendes pr. e-mail. 
                Manglende betaling medfører rykker med 7 dages frist, derefter suspension af adgang.
              </p>
            </div>

            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">3.4</h3>
              <p className="text-gray-700">
                Prisændringer varsles med 30 dages varsel. Kunden kan opsige abonnementet til ændringens ikrafttræden.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Brug, fair use og suspension</h2>
            
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">4.1</h3>
              <p className="text-gray-700">
                Kunden må ikke anvende Tjenesten til formål i strid med lovgivning, herunder 
                forskelsbehandlings- og persondatalovgivning.
              </p>
            </div>

            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">4.2</h3>
              <p className="text-gray-700">
                Rekruna kan midlertidigt begrænse eller suspendere adgang ved misbrug, usædvanlig aktivitet 
                eller sikkerhedsrisiko. Kunden varsles, hvor muligt, inden suspension.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Databeskyttelse (GDPR)</h2>
            
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">5.1 Roller</h3>
              <p className="text-gray-700">
                Kunden er dataansvarlig for de oplysninger, der uploades til Tjenesten. Rekruna er 
                databehandler og handler alene efter Kundens instrukser via en separat Databehandleraftale (DPA).
              </p>
            </div>

            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">5.2 Opbevaring</h3>
              <p className="text-gray-700 mb-2">Data slettes eller anonymiseres automatisk:</p>
              <ul className="list-disc list-inside text-gray-700 ml-4 space-y-2">
                <li>Efter 60 dage, når abonnement er aktivt.</li>
                <li>Senest 90 dage efter ophør af aftalen.</li>
                <li>Systemlogdata opbevares i minimum 6 måneder i overensstemmelse med AI Act.</li>
              </ul>
            </div>

            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">5.3 Sikkerhed</h3>
              <p className="text-gray-700">
                Rekruna implementerer passende tekniske og organisatoriske foranstaltninger, herunder 
                kryptering, adgangskontrol og løbende sårbarhedstest.
              </p>
            </div>

            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">5.4 Underdatabehandlere</h3>
              <p className="text-gray-700">
                Liste over underdatabehandlere fremgår af DPA. Overførsler til tredjelande sker kun med 
                gyldigt overførselsgrundlag jf. GDPR kapitel V.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Ikke-diskrimination</h2>
            <p className="text-gray-700">
              Kunden forpligter sig til at anvende Tjenesten i overensstemmelse med dansk ansættelsesret, 
              herunder reglerne om ligebehandling og forbud mod direkte og indirekte diskrimination.
            </p>
          </section>

          {/* Section 7 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Hændelser og myndighedsunderretning</h2>
            <p className="text-gray-700">
              Ved alvorlig hændelse ("serious incident") efter AI Act art. 73 underretter Rekruna relevant 
              myndighed og Kunden uden ugrundet ophold. Kunden skal straks informere Rekruna om hændelser, 
              der kan påvirke systemets sikkerhed eller resultater.
            </p>
          </section>

          {/* Section 8 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Drift og support</h2>
            <p className="text-gray-700">
              Rekruna tilstræber høj driftstid. Planlagt vedligehold varsles på forhånd. SLA og oppetid 
              offentliggøres separat, når driftsdata foreligger. Support ydes via e-mail i normal arbejdstid.
            </p>
          </section>

          {/* Section 9 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Ansvar og begrænsning</h2>
            <p className="text-gray-700">
              Rekruna er ikke ansvarlig for indirekte tab, driftstab, tabt fortjeneste eller datarekonstruktion. 
              Samlet ansvar er begrænset til Kundens betaling for Tjenesten de seneste 12 måneder forud for 
              skadens indtræden. Ansvarsbegrænsning gælder ikke ved forsæt eller grov uagtsomhed.
            </p>
          </section>

          {/* Section 10 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Varighed og opsigelse</h2>
            <ul className="list-disc list-inside text-gray-700 ml-4 space-y-2">
              <li>Abonnementer kan opsiges med løbende måned + 30 dage.</li>
              <li>Rekruna One og Booster-produkter er engangskøb uden fortrydelsesret (B2B).</li>
              <li>Ved ophør kan Kunden eksportere data i CSV-format inden 30 dage, hvorefter data slettes jf. pkt. 5.2.</li>
            </ul>
          </section>

          {/* Section 11 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Ændringer af vilkår</h2>
        <p className="text-gray-700">
              Rekruna kan ændre Vilkår med 30 dages varsel. Fortsat brug efter ikrafttræden betragtes som accept. 
              Mindre tekniske forbedringer kan ske uden varsel.
            </p>
          </section>

          {/* Section 12 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Lovvalg og værneting</h2>
            <p className="text-gray-700">
              Aftalen er underlagt dansk ret. Tvister afgøres ved Retten i Roskilde som første instans, 
              medmindre præceptiv lovgivning foreskriver andet.
            </p>
          </section>

          {/* Last Updated */}
          <div className="mt-12 pt-6 border-t border-gray-300">
            <p className="text-sm text-gray-600 italic">
              Senest opdateret: 17. Oktober 2025
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}


