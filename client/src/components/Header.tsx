import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-primary-color text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <Link 
          to="/" 
          className="flex items-center space-x-3 text-2xl font-bold hover:text-accent-color transition-colors"
        >
          {/* Icono de base de datos */}
          <svg 
            className="w-8 h-8" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M21 12C21 13.66 16.97 15 12 15C7.03 15 3 13.66 3 12" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M3 5V19C3 20.66 7.03 22 12 22C16.97 22 21 20.66 21 19V5" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <ellipse 
              cx="12" 
              cy="5" 
              rx="9" 
              ry="3" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          
          <span>CRUD CSV</span>
        </Link>
      </div>
    </header>
  );
};

export default Header;