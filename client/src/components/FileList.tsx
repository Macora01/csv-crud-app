import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SeparatorModal from './SeparatorModal';

interface FileItem {
  name: string;
}

const FileList: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [fileToManage, setFileToManage] = useState<string | null>(null);

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
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Por favor selecciona un archivo' });
      return;
    }
    const formData = new FormData();
    formData.append('csvFile', selectedFile!);
    setUploading(true);
    try {
      await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
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
  
  const handleArchive = async (filename: string) => {
    if (window.confirm(`¿Estás seguro de que quieres archivar "${filename}"? Ya no aparecerá en la lista principal.`)) {
      try {
        await axios.post(`/api/file/${encodeURIComponent(filename)}/archive`);
        setMessage({ type: 'success', text: 'Archivo archivado' });
        fetchFiles();
      } catch (error) {
        console.error('Error archiving file:', error);
        setMessage({ type: 'error', text: 'Error al archivar el archivo' });
      }
    }
  };
  
  const openManageModal = (filename: string) => {
    setFileToManage(filename);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFileToManage(null);
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6 text-primary-color">Gestión de Archivos CSV</h2>
      
      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}
      
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
                <div className="flex flex-col justify-between h-full">
                  <div className="mb-2">
                    <h4 className="font-medium text-primary-color break-words">{file.name}</h4>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => openManageModal(file.name)}
                      className="btn btn-secondary text-sm flex-1"
                    >
                      Gestionar
                    </button>
                    <button
                      onClick={() => handleArchive(file.name)}
                      className="btn btn-danger text-sm flex-1"
                      title="Archivar archivo"
                    >
                      Archivar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && fileToManage && (
        <SeparatorModal filename={fileToManage} onClose={closeModal} />
      )}
    </div>
  );
};

export default FileList;