import React from 'react';
import { Clock, Target, TrendingUp, ArrowRight, Calculator, Users, BarChart3, DollarSign } from 'lucide-react';
import { PageType } from '../App';

interface LandingPageProps {
  onPageChange: (page: PageType) => void;
}

export default function LandingPage({ onPageChange }: LandingPageProps) {
  const [applicationCount, setApplicationCount] = React.useState(25);
  
  const calculateReadingTime = (count: number) => {
    const pagesPerApplication = 3;
    const minutesPerPage = 3;
    const totalMinutes = count * pagesPerApplication * minutesPerPage;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { hours, minutes, totalMinutes };
  };
  
  const readingTime = calculateReadingTime(applicationCount);

  return (
    <div className="min-h-screen">
      {/* Hero Section with Background Image */}
      <section 
        className="relative h-screen flex items-center bg-cover bg-center"
        style={{
          backgroundImage: 'url("https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop")',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backgroundBlendMode: 'overlay'
        }}
      >
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center h-full">
            <div className="text-left text-white max-w-2xl">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Screen & Prioriter alle ansøgninger på <span style={{ color: '#FF6F61' }}>under 5 minutter</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 leading-relaxed opacity-90">
                Den intelligente løsning for rekrutteringsansvarlige. 
                Analyser og prioriter ansøgninger objektivt med granuleret pointsystem og argumentation.
              </p>
              <button
                onClick={() => onPageChange('signup')}
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                style={{ backgroundColor: '#FF6F61' }}
              >
                Kom i gang i dag
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section - Right after Hero */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left Column - Heading and Description */}
            <div className="text-left">
              <p className="text-sm font-medium mb-2" style={{ color: '#FF6F61' }}>Hvorfor Rekruna?</p>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                HVORFOR VI ER DIT<br />
                BEDSTE VALG
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Specialdesignet til rekrutteringsansvarlige der ønsker effektiv analyse og
                prioritering af ansøgninger med granuleret pointsystem og objektiv vurdering.
              </p>
            </div>
            
            {/* Right Column - 2x2 Grid of Value Propositions */}
            <div className="grid grid-cols-2 gap-8">
              <div className="text-left">
                <div className="flex items-center justify-center w-12 h-12 rounded-full mb-4" style={{ backgroundColor: 'rgba(255, 111, 97, 0.1)' }}>
                  <Clock className="h-6 w-6" style={{ color: '#FF6F61' }} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Reduceret tidsforbrug</h3>
                <p className="text-gray-600 leading-relaxed">
                  Analyser alle ansøgninger på under 5 minutter uanset antal kandidater.
                </p>
              </div>
              
              <div className="text-left">
                <div className="flex items-center justify-center w-12 h-12 rounded-full mb-4" style={{ backgroundColor: 'rgba(255, 111, 97, 0.1)' }}>
                  <BarChart3 className="h-6 w-6" style={{ color: '#FF6F61' }} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Objektiv sammenligning uden bias</h3>
                <p className="text-gray-600 leading-relaxed">
                  AI-drevet analyse sikrer objektiv vurdering med granuleret pointsystem.
                </p>
              </div>
              
              <div className="text-left">
                <div className="flex items-center justify-center w-12 h-12 rounded-full mb-4" style={{ backgroundColor: 'rgba(255, 111, 97, 0.1)' }}>
                  <Target className="h-6 w-6" style={{ color: '#FF6F61' }} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Prioriteret kandidatliste ud fra ansættelseskrav</h3>
                <p className="text-gray-600 leading-relaxed">
                  Kandidater rangeret efter ansættelseskrav med detaljeret scoring.
                </p>
              </div>
              
              <div className="text-left">
                <div className="flex items-center justify-center w-12 h-12 rounded-full mb-4" style={{ backgroundColor: 'rgba(255, 111, 97, 0.1)' }}>
                  <DollarSign className="h-6 w-6" style={{ color: '#FF6F61' }} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Spar udgifter til bureauer</h3>
                <p className="text-gray-600 leading-relaxed">
                  Undgå dyre rekrutteringsbureauer med intern AI-analyse.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Time Calculator Section */}
      <section className="py-20" style={{ backgroundColor: '#F5F5F0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Calculator className="h-12 w-12" style={{ color: '#FF6F61' }} />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Så meget tid kan du spare med Rekruna
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Beregn din tidsbesparelse ved at bruge Rekruna til at analysere og prioritere dine ansøgninger
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto bg-white rounded-xl p-8 shadow-sm">
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                Vælg antal ansøgninger som skal analyseres: <span style={{ color: '#FF6F61' }}>{applicationCount}</span>
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={applicationCount}
                  onChange={(e) => setApplicationCount(Number(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #FF6F61 0%, #FF6F61 ${applicationCount}%, #e5e7eb ${applicationCount}%, #e5e7eb 100%)`
                  }}
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>0</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100</span>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gennemsnitlig læsetid <span className="font-bold">uden</span> Rekruna:</h3>
              <div className="text-4xl font-bold mb-6" style={{ color: '#FF6F61' }}>
                {readingTime.hours > 0 && `${readingTime.hours} timer`}
                {readingTime.hours > 0 && readingTime.minutes > 0 && ' og '}
                {readingTime.minutes > 0 && `${readingTime.minutes} minutter`}
                {readingTime.totalMinutes === 0 && '0 minutter'}
              </div>
              
              {applicationCount > 0 && (
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 111, 97, 0.1)' }}>
                  <p className="font-semibold text-gray-900">
                    Med Rekruna analyserer du alle ansøgninger på <span style={{ color: '#FF6F61' }}>under 5 minutter</span>!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left Column - Heading and Image */}
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: '#FF6F61' }}>Frequently Asked Questions</p>
              <h2 className="text-4xl font-bold text-gray-900 mb-8">
                FIND KLARHED I<br />
                ALMINDELIGE SPØRGSMÅL
              </h2>
              <div className="rounded-xl overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
                  alt="Customer support representative"
                  className="w-full h-64 object-cover"
                />
              </div>
            </div>
            
            {/* Right Column - FAQ Items */}
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-4">
                <button className="flex justify-between items-center w-full text-left">
                  <span className="text-lg font-medium text-gray-900">
                    Hvor mange ansøgninger kan jeg uploade?
                  </span>
                  <span className="text-2xl text-gray-400">+</span>
                </button>
                <div className="mt-2 text-gray-600">
                  Du kan uploade lige så mange ansøgninger pr. stillingsopslag du har brug for.
                </div>
              </div>
              
              <div className="border-b border-gray-200 pb-4">
                <button className="flex justify-between items-center w-full text-left">
                  <span className="text-lg font-medium text-gray-900">
                    Hvor præcis er AI-analysen af CV'erne?
                  </span>
                  <span className="text-2xl text-gray-400">+</span>
                </button>
                <div className="mt-2 text-gray-600">
                  Vores AI er trænet på tusindvis af CV'er og giver objektive vurderinger baseret på dine specifikke krav.
                </div>
              </div>
              
              <div className="border-b border-gray-200 pb-4">
                <button className="flex justify-between items-center w-full text-left">
                  <span className="text-lg font-medium text-gray-900">
                    Kan jeg tilpasse kriterierne for hver stilling?
                  </span>
                  <span className="text-2xl text-gray-400">+</span>
                </button>
                <div className="mt-2 text-gray-600">
                  Ja, du kan vælge og tilpasse "must-have" krav for hver enkelt stilling du screener.
                </div>
              </div>
              
              <div className="border-b border-gray-200 pb-4">
                <button className="flex justify-between items-center w-full text-left">
                  <span className="text-lg font-medium text-gray-900">
                    Hvor hurtigt får jeg resultaterne?
                  </span>
                  <span className="text-2xl text-gray-400">+</span>
                </button>
                <div className="mt-2 text-gray-600">
                  Analysen tager typisk 2-3 minutter uanset hvor mange ansøgninger du uploader.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20" style={{ backgroundColor: '#F5F5F0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simpel og transparent prissæt
            </h2>
            <p className="text-xl text-gray-600">
              Alt hvad du behøver for at optimere din rekrutteringsproces
            </p>
          </div>
          
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-sm border-2" style={{ borderColor: '#FF6F61' }}>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Rekruna One</h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold text-gray-900">249</span>
                  <span className="text-xl text-gray-600 ml-2">kr/måned</span>
                </div>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FF6F61' }}>
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <span className="ml-3 text-gray-700 font-medium">Ubegrænset scanninger</span>
                </div>
                
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FF6F61' }}>
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <span className="ml-3 text-gray-700 font-medium">AI powered analyse</span>
                </div>
                
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FF6F61' }}>
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <span className="ml-3 text-gray-700 font-medium">PDF rapporter</span>
                </div>
              </div>
              
              <button
                onClick={() => onPageChange('signup')}
                className="w-full py-4 text-lg font-semibold text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                style={{ backgroundColor: '#FF6F61' }}
              >
                Kom i gang i dag
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section Placeholder */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">
            Footer Sektion
          </h2>
        </div>
      </section>
    </div>
  );
}