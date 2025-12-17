// client/src/components/Header.tsx

import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-primary-color text-white shadow-md border-b border-accent-color">
      <div className="container mx-auto px-4 py-3">
        <Link 
          to="/" 
          className="flex items-center space-x-3 text-2xl font-bold hover:text-accent-color transition-colors"
          title="Inicio"
        >
          {/* El SVG del icono ha sido eliminado */}
          <span>CRUD CSV</span>
        </Link>
        
        <nav>
          <ul className="flex items-center space-x-8">
            <li>
              <Link 
                to="/" 
                className="nav-link relative text-base font-medium transition-colors duration-300 hover:text-accent-color py-1"
              >
                Archivos
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;

