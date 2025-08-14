import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import SignupPage from './components/SignupPage';
import LoginPage from './components/LoginPage';
import CVScreenerApp from './components/CVScreenerApp';
import Navigation from './components/Navigation';

export type PageType = 'landing' | 'signup' | 'login' | 'app';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handlePageChange = (page: PageType) => {
    setCurrentPage(page);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentPage('app');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage('landing');
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Inter, sans-serif' }}>
      {currentPage !== 'app' && (
        <Navigation 
          currentPage={currentPage} 
          onPageChange={handlePageChange}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
        />
      )}
      
      {currentPage === 'landing' && (
        <LandingPage onPageChange={handlePageChange} />
      )}
      
      {currentPage === 'signup' && (
        <SignupPage onPageChange={handlePageChange} />
      )}
      
      {currentPage === 'login' && (
        <LoginPage onPageChange={handlePageChange} onLogin={handleLogin} />
      )}
      
      {currentPage === 'app' && isLoggedIn && (
        <CVScreenerApp onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;