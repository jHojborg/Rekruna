import React from 'react';
import { FileText, LogOut } from 'lucide-react';
import { PageType } from '../App';

interface NavigationProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  isLoggedIn: boolean;
  onLogout: () => void;
}

export default function Navigation({ currentPage, onPageChange, isLoggedIn, onLogout }: NavigationProps) {
  return (
    <nav className="bg-white shadow-sm border-b" style={{ backgroundColor: '#F5F5F0' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div 
              className="flex items-center cursor-pointer"
              onClick={() => onPageChange('landing')}
            >
              <FileText className="h-8 w-8" style={{ color: '#FF6F61' }} />
              <span className="ml-2 text-xl font-bold text-gray-900">Rekruna</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {!isLoggedIn ? (
              <>
                <button
                  onClick={() => onPageChange('login')}
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Log ind
                </button>
                <button
                  onClick={() => onPageChange('signup')}
                  className="text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200"
                  style={{ backgroundColor: '#FF6F61' }}
                >
                  Start i dag
                </button>
              </>
            ) : (
              <button
                onClick={onLogout}
                className="flex items-center text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log ud
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}