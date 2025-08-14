import React, { useState } from 'react';
import { LogOut, Upload, FileText, CheckCircle, Download, RotateCcw } from 'lucide-react';

interface CVScreenerAppProps {
  onLogout: () => void;
}

type StepType = 'upload' | 'requirements' | 'cvs' | 'results';

interface Requirement {
  id: number;
  text: string;
  selected: boolean;
}

interface CandidateResult {
  name: string;
  overallRating: number;
  keyStrengths: string[];
  concernAreas: string[];
  requirementScores: { [key: string]: number };
}

export default function CVScreenerApp({ onLogout }: CVScreenerAppProps) {
  const [currentStep, setCurrentStep] = useState<StepType>('upload');
  const [jobDescription, setJobDescription] = useState<File | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [cvFiles, setCvFiles] = useState<FileList | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<CandidateResult[]>([]);

  // Mock requirements generated from job description
  const mockRequirements: Requirement[] = [
    { id: 1, text: "Minimum 3 års erfaring med JavaScript", selected: false },
    { id: 2, text: "Erfaring med React eller Vue.js", selected: false },
    { id: 3, text: "Kendskab til agile arbejdsmetoder", selected: false },
    { id: 4, text: "Erfaring med database design og SQL", selected: false },
    { id: 5, text: "Gode kommunikationsevner på dansk", selected: false },
    { id: 6, text: "Bachelor i datalogi eller lignende", selected: false },
    { id: 7, text: "Erfaring med cloud-platforme (AWS/Azure)", selected: false }
  ];

  // Mock results
  const mockResults: CandidateResult[] = [
    {
      name: "Anna Larsen",
      overallRating: 9.2,
      keyStrengths: ["5+ års JavaScript erfaring", "Stærk React-baggrund", "Tidligere ledelseserfaring"],
      concernAreas: ["Begrænset cloud-erfaring"],
      requirementScores: { "JavaScript": 95, "React": 92, "Agile": 88 }
    },
    {
      name: "Michael Hansen",
      overallRating: 8.7,
      keyStrengths: ["Solid full-stack erfaring", "Certificeret i AWS", "Gode referencer"],
      concernAreas: ["Nyere med agile metoder", "Kun 2 års erfaring"],
      requirementScores: { "JavaScript": 85, "React": 80, "Agile": 70 }
    },
    {
      name: "Sarah Nielsen",
      overallRating: 7.8,
      keyStrengths: ["Stærk akademisk baggrund", "Hurtig lærer", "Gode kommunikationsevner"],
      concernAreas: ["Begrænset praktisk erfaring", "Ingen React-erfaring"],
      requirementScores: { "JavaScript": 75, "React": 40, "Agile": 85 }
    }
  ];

  const handleJobDescriptionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setJobDescription(e.target.files[0]);
    }
  };

  const handleStartAnalysis = () => {
    if (jobDescription) {
      setRequirements(mockRequirements);
      setCurrentStep('requirements');
    }
  };

  const handleRequirementChange = (id: number) => {
    setRequirements(prev => 
      prev.map(req => 
        req.id === id 
          ? { ...req, selected: !req.selected }
          : req
      )
    );
  };

  const selectedRequirementsCount = requirements.filter(req => req.selected).length;

  const handleContinueToCV = () => {
    if (selectedRequirementsCount === 3) {
      setCurrentStep('cvs');
    }
  };

  const handleCVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCvFiles(e.target.files);
    }
  };

  const handleAnalyzeCVs = async () => {
    if (cvFiles && cvFiles.length > 0) {
      setIsAnalyzing(true);
      // Simulate API call
      setTimeout(() => {
        setResults(mockResults);
        setCurrentStep('results');
        setIsAnalyzing(false);
      }, 3000);
    }
  };

  const handleNewAnalysis = () => {
    setCurrentStep('upload');
    setJobDescription(null);
    setRequirements([]);
    setCvFiles(null);
    setResults([]);
  };

  const renderProgressBar = () => {
    const steps = ['upload', 'requirements', 'cvs', 'results'];
    const currentIndex = steps.indexOf(currentStep);
    
    return (
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentIndex 
                    ? 'text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}
                style={{ backgroundColor: index <= currentIndex ? '#FF6F61' : undefined }}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div 
                  className={`w-12 h-1 mx-2 ${
                    index < currentIndex ? 'bg-orange-500' : 'bg-gray-200'
                  }`}
                  style={{ backgroundColor: index < currentIndex ? '#FF6F61' : undefined }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F0' }}>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <FileText className="h-8 w-8" style={{ color: '#FF6F61' }} />
              <span className="ml-2 text-xl font-bold text-gray-900">CVScreener</span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log ud
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {renderProgressBar()}

        {currentStep === 'upload' && (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <Upload className="h-16 w-16 mx-auto mb-6 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Stillingsbeskrivelse</h2>
            <p className="text-gray-600 mb-8">Upload en PDF-fil med stillingsbeskrivelsen for at starte analysen</p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6">
              <input
                type="file"
                accept=".pdf"
                onChange={handleJobDescriptionUpload}
                className="hidden"
                id="job-description-upload"
              />
              <label htmlFor="job-description-upload" className="cursor-pointer">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {jobDescription ? jobDescription.name : "Klik for at vælge fil"}
                  </p>
                  <p className="text-gray-500">Kun PDF-filer accepteres</p>
                </div>
              </label>
            </div>

            <button
              onClick={handleStartAnalysis}
              disabled={!jobDescription}
              className="px-8 py-3 text-lg font-semibold text-white rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{ backgroundColor: '#FF6F61' }}
            >
              Start Analyse
            </button>
          </div>
        )}

        {currentStep === 'requirements' && (
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Vælg "Must-Have" Krav</h2>
            <p className="text-gray-600 mb-8">Vælg præcis 3 krav som er mest kritiske for stillingen</p>
            
            <div className="space-y-4 mb-8">
              {requirements.map((req) => (
                <div
                  key={req.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    req.selected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ borderColor: req.selected ? '#FF6F61' : undefined }}
                  onClick={() => handleRequirementChange(req.id)}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                      req.selected ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                    }`}
                    style={{ borderColor: req.selected ? '#FF6F61' : undefined, backgroundColor: req.selected ? '#FF6F61' : undefined }}
                    >
                      {req.selected && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                    <span className="font-medium text-gray-900">{req.text}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Valgt: {selectedRequirementsCount}/3 krav
              </p>
              <button
                onClick={handleContinueToCV}
                disabled={selectedRequirementsCount !== 3}
                className="px-8 py-3 text-lg font-semibold text-white rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                style={{ backgroundColor: '#FF6F61' }}
              >
                Fortsæt
              </button>
            </div>
          </div>
        )}

        {currentStep === 'cvs' && (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <Upload className="h-16 w-16 mx-auto mb-6 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload CV'er</h2>
            <p className="text-gray-600 mb-8">Upload de CV'er du vil analysere (PDF-format)</p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6">
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={handleCVUpload}
                className="hidden"
                id="cv-upload"
              />
              <label htmlFor="cv-upload" className="cursor-pointer">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {cvFiles && cvFiles.length > 0 
                      ? `${cvFiles.length} fil(er) valgt` 
                      : "Klik for at vælge CV'er"
                    }
                  </p>
                  <p className="text-gray-500">Flere PDF-filer kan vælges samtidigt</p>
                </div>
              </label>
            </div>

            <button
              onClick={handleAnalyzeCVs}
              disabled={!cvFiles || cvFiles.length === 0 || isAnalyzing}
              className="px-8 py-3 text-lg font-semibold text-white rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{ backgroundColor: '#FF6F61' }}
            >
              {isAnalyzing ? 'Analyserer...' : 'Analyser CV\'er'}
            </button>

            {isAnalyzing && (
              <div className="mt-8">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#FF6F61' }}></div>
                </div>
                <p className="text-gray-600 mt-4">Analyserer CV'er og sammenligner med krav...</p>
              </div>
            )}
          </div>
        )}

        {currentStep === 'results' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Analyse Resultater</h2>
              
              {/* Prioritized Results */}
              <div className="space-y-6">
                {results.map((candidate, index) => (
                  <div key={index} className="border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{candidate.name}</h3>
                        <div className="flex items-center mt-2">
                          <span className="text-sm font-medium text-gray-600 mr-2">Overall Rating:</span>
                          <span className="text-2xl font-bold" style={{ color: '#FF6F61' }}>
                            {candidate.overallRating}/10
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                              style={{ 
                                backgroundColor: index === 0 ? '#FF6F61' : index === 1 ? '#FFA500' : '#9CA3AF',
                                color: 'white'
                              }}>
                          #{index + 1} Prioritet
                        </span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Styrker</h4>
                        <ul className="space-y-1">
                          {candidate.keyStrengths.map((strength, i) => (
                            <li key={i} className="text-green-700 text-sm flex items-center">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Bekymringsområder</h4>
                        <ul className="space-y-1">
                          {candidate.concernAreas.map((concern, i) => (
                            <li key={i} className="text-red-600 text-sm">
                              • {concern}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Matrix Summary */}
              <div className="mt-12 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Kandidat Sammenligning</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-900">Kandidat</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-900">Overall</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-900">JavaScript</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-900">React</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-900">Agile</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((candidate, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 font-medium text-gray-900">{candidate.name}</td>
                          <td className="px-4 py-2" style={{ color: '#FF6F61' }}>
                            {candidate.overallRating}/10
                          </td>
                          <td className="px-4 py-2">{candidate.requirementScores.JavaScript}%</td>
                          <td className="px-4 py-2">{candidate.requirementScores.React}%</td>
                          <td className="px-4 py-2">{candidate.requirementScores.Agile}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex justify-center space-x-4">
                <button
                  onClick={() => alert('Download rapport funktionalitet kommer snart')}
                  className="flex items-center px-6 py-3 text-lg font-semibold text-white rounded-lg shadow-sm transition-all duration-200"
                  style={{ backgroundColor: '#FF6F61' }}
                >
                  <Download className="h-5 w-5 mr-2" />
                  Download Rapport som PDF
                </button>
                
                <button
                  onClick={handleNewAnalysis}
                  className="flex items-center px-6 py-3 text-lg font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-all duration-200"
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Start Ny Analyse
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}