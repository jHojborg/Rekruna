import React, { useState } from 'react';
import { Mail, Lock, User, CreditCard } from 'lucide-react';
import { PageType } from '../App';

interface SignupPageProps {
  onPageChange: (page: PageType) => void;
}

export default function SignupPage({ onPageChange }: SignupPageProps) {
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    postalCode: '',
    city: '',
    cvrNumber: '',
    name: '',
    email: '',
    password: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    acceptTerms: false
  });

  const [selectedPlan, setSelectedPlan] = useState('monthly');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle signup logic here
    alert('Konto oprettet! Du vil modtage en mail med et login-link.');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Opret din konto</h1>
          <p className="text-lg text-gray-600">Kom i gang med Rekruna allerede i dag</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Account Information */}
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Kontooplysninger</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Firmanavn
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200"
                  style={{ '--tw-ring-color': '#FF6F61' } as React.CSSProperties}
                  placeholder="Dit firmanavn"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200"
                  style={{ '--tw-ring-color': '#FF6F61' } as React.CSSProperties}
                  placeholder="Firmaadresse"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postnummer
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200"
                    style={{ '--tw-ring-color': '#FF6F61' } as React.CSSProperties}
                    placeholder="0000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    By
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200"
                    style={{ '--tw-ring-color': '#FF6F61' } as React.CSSProperties}
                    placeholder="By"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CVR nr.
                </label>
                <input
                  type="text"
                  name="cvrNumber"
                  value={formData.cvrNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200"
                  style={{ '--tw-ring-color': '#FF6F61' } as React.CSSProperties}
                  placeholder="12345678"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-2" />
                  Fulde navn
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200"
                  style={{ '--tw-ring-color': '#FF6F61' } as React.CSSProperties}
                  placeholder="Dit fulde navn"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline h-4 w-4 mr-2" />
                  Email adresse
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200"
                  style={{ '--tw-ring-color': '#FF6F61' } as React.CSSProperties}
                  placeholder="din@email.dk"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="inline h-4 w-4 mr-2" />
                  Kodeord
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200"
                  style={{ '--tw-ring-color': '#FF6F61' } as React.CSSProperties}
                  placeholder="Vælg et sikkert kodeord"
                  required
                />
              </div>
            </form>
          </div>

          {/* Subscription & Payment */}
          <div className="space-y-6">
            {/* Plan Selection */}
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Rekruna One Abonnement</h2>
              <div className="p-4 border-2 rounded-lg" style={{ borderColor: '#FF6F61' }}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-900">Månedligt</h3>
                    <p className="text-gray-600">Fleksibel betaling hver måned</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-gray-900">249</span>
                    <span className="text-lg text-gray-900 ml-1">kr</span>
                    <p className="text-gray-600">/måned</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                <CreditCard className="inline h-6 w-6 mr-2" />
                Betalingsoplysninger
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kortnummer
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200"
                    style={{ '--tw-ring-color': '#FF6F61' } as React.CSSProperties}
                    placeholder="1234 5678 9012 3456"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Udløb
                    </label>
                    <input
                      type="text"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200"
                      style={{ '--tw-ring-color': '#FF6F61' } as React.CSSProperties}
                      placeholder="MM/ÅÅ"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      name="cvv"
                      value={formData.cvv}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200"
                      style={{ '--tw-ring-color': '#FF6F61' } as React.CSSProperties}
                      placeholder="123"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Navn på kort
                  </label>
                  <input
                    type="text"
                    name="cardName"
                    value={formData.cardName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200"
                    style={{ '--tw-ring-color': '#FF6F61' } as React.CSSProperties}
                    placeholder="Navn som det står på kortet"
                    required
                  />
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="acceptTerms"
                      name="acceptTerms"
                      type="checkbox"
                      checked={formData.acceptTerms}
                      onChange={(e) => setFormData({...formData, acceptTerms: e.target.checked})}
                      className="focus:ring-2 h-4 w-4 border-gray-300 rounded"
                      style={{ '--tw-ring-color': '#FF6F61', accentColor: '#FF6F61' } as React.CSSProperties}
                      required
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="acceptTerms" className="text-gray-700">
                      Jeg bekræfter at have læst og accepterer Rekruna handelsbetingelser
                    </label>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                  <div className="flex items-center text-gray-600">
                    <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-sm">Sikker betaling med SSL-kryptering</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">Du vil modtage en mail med et login-link</span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <span>Har du allerede en konto? </span>
                    <button
                      type="button"
                      onClick={() => onPageChange('login')}
                      className="font-medium hover:underline"
                      style={{ color: '#FF6F61' }}
                    >
                      Log ind her
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={handleSubmit}
            className="px-12 py-4 text-lg font-semibold text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            style={{ backgroundColor: '#FF6F61' }}
          >
            Opret konto
          </button>
        </div>
      </div>
    </div>
  );
}