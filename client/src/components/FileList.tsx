import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface FileItem {
  name: string;
}

const FileList: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await axios.get('/api/files');
      setFiles(response.data.map((name: string) => ({ name })));
    } catch (error) {
      console.error('Error fetching files:', error);
      setMessage({ type: 'error', text: 'Error al cargar los archivos' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // e.target.files[0] ya es de tipo File, no necesitamos 'as any'
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Por favor selecciona un archivo' });
      return;
    }

    const formData = new FormData();
    // Usamos el operador '!' para asegurar a TypeScript que el archivo no es nulo
    formData.append('csvFile', selectedFile!);

    setUploading(true);
    try {
      await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage({ type: 'success', text: 'Archivo subido exitosamente' });
      setSelectedFile(null);
      fetchFiles();
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage({ type: 'error', text: 'Error al subir el archivo' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6 text-primary-color">Gestión de Archivos CSV</h2>
      
      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-primary-color">Subir nuevo archivo</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="form-input"
          />
          <button
            onClick={handleUpload}
            disabled={uploading || !selectedFile}
            className="btn btn-primary"
          >
            {uploading ? 'Subiendo...' : 'Subir archivo'}
          </button>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4 text-primary-color">Archivos disponibles</h3>
        {files.length === 0 ? (
          <p className="text-text-light">No hay archivos CSV disponibles</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <div key={file.name} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-primary-color">{file.name}</h4>
                  </div>
                  <Link
                    to={`/file/${encodeURIComponent(file.name)}`}
                    className="btn btn-secondary"
                  >
                    Gestionar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileList;