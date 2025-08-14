import React, { useState } from 'react';
import { Mail, Lock, FileText } from 'lucide-react';
import { PageType } from '../App';

interface LoginPageProps {
  onPageChange: (page: PageType) => void;
  onLogin: () => void;
}

export default function LoginPage({ onPageChange, onLogin }: LoginPageProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    onLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-16" style={{ backgroundColor: '#F5F5F0' }}>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Log ind til din konto</h2>
          <p className="mt-2 text-gray-600">Log ind og lad os komme igang</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="Dit kodeord"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <button
                  type="button"
                  className="font-medium hover:underline"
                  style={{ color: '#FF6F61' }}
                  onClick={() => alert('Glemt kodeord funktionalitet kommer snart')}
                >
                  Glemt kodeord?
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 hover:shadow-lg"
                style={{ backgroundColor: '#FF6F61', '--tw-ring-color': '#FF6F61' } as React.CSSProperties}
              >
                Log ind
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <span className="text-gray-600">Har du ikke en konto? </span>
            <button
              onClick={() => onPageChange('signup')}
              className="font-medium hover:underline"
              style={{ color: '#FF6F61' }}
            >
              Sign up her
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}