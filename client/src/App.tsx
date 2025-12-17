import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import FileList from './components/FileList';
import CsvViewer from './components/CsvViewer';
import Header from './components/Header';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background-color">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<FileList />} />
            <Route path="/file/:filename" element={<CsvViewer />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
