import React, { useState, useEffect, useCallback } from 'react'; // <-- ¡AÑADIMOS useCallback!
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

interface RowData {
  [key: string]: string;
}

const CsvViewer: React.FC = () => {
  const { filename } = useParams<{ filename: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const initialSeparator = (location.state?.separator as string) || ',';
  // No necesitamos el setter del separador, así que lo eliminamos.
  const separator = initialSeparator;

  const [data, setData] = useState<RowData[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<RowData>({});
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  // Envuelve fetchData en useCallback para que no se recree en cada render
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/file/${encodeURIComponent(filename!)}?separator=${separator}`);
      setData(response.data);
      if (response.data.length > 0) {
        setHeaders(Object.keys(response.data[0]));
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos del archivo. ¿Es correcto el separador?');
    } finally {
      setLoading(false);
    }
  }, [filename, separator]); // Las dependencias de fetchData

  useEffect(() => {
    if (filename) {
      fetchData();
    }
  }, [filename, fetchData]); // Ahora fetchData es una dependencia segura

  const saveStructure = async (newHeaders: string[], currentData: RowData[]) => {
    setSaving(true);
    try {
      const newData = currentData.map(row => {
        const newRow: RowData = {};
        newHeaders.forEach(header => {
          newRow[header] = row[header] || '';
        });
        return newRow;
      });

      await axios.put(`/api/file/${encodeURIComponent(filename!)}/structure`, { newData, separator });
      setMessage({ type: 'success', text: 'Estructura de columnas actualizada' });
      setHeaders(newHeaders);
    } catch (err) {
      console.error('Error saving structure:', err);
      setMessage({ type: 'error', text: 'Error al guardar la estructura' });
    } finally {
      setSaving(false);
    }
  };
  
  const moveColumn = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === headers.length - 1)
    ) {
      return;
    }
    const newHeaders = [...headers];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newHeaders[index], newHeaders[targetIndex]] = [newHeaders[targetIndex], newHeaders[index]];
    saveStructure(newHeaders, data);
  };

  const deleteColumn = (index: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta columna y todos sus datos?')) {
      const headerToDelete = headers[index];
      const newHeaders = headers.filter((_, i) => i !== index);
      const newData = data.map(row => {
        const newRow = { ...row };
        delete newRow[headerToDelete];
        return newRow;
      });
      saveStructure(newHeaders, newData);
    }
  };

  const handleAddRow = async () => {
    try {
      await axios.post(`/api/file/${encodeURIComponent(filename!)}/row`, { newRow: formData, separator });
      setMessage({ type: 'success', text: 'Fila agregada exitosamente' });
      setShowAddModal(false);
      setFormData({});
      fetchData();
    } catch (err) {
      console.error('Error adding row:', err);
      setMessage({ type: 'error', text: 'Error al agregar la fila' });
    }
  };

  const handleEditRow = (index: number) => {
    setEditingIndex(index);
    setFormData({ ...data[index] });
    setShowEditModal(true);
  };

  const handleUpdateRow = async () => {
    try {
      await axios.put(`/api/file/${encodeURIComponent(filename!)}/row/${editingIndex!}`, { updatedRow: formData, separator });
      setMessage({ type: 'success', text: 'Fila actualizada exitosamente' });
      setShowEditModal(false);
      setEditingIndex(null);
      setFormData({});
      fetchData();
    } catch (err) {
      console.error('Error updating row:', err);
      setMessage({ type: 'error', text: 'Error al actualizar la fila' });
    }
  };

  const handleDeleteRow = async (index: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta fila?')) {
      try {
        await axios.delete(`/api/file/${encodeURIComponent(filename!)}/row/${index}?separator=${separator}`);
        setMessage({ type: 'success', text: 'Fila eliminada exitosamente' });
        fetchData();
      } catch (err) {
        console.error('Error deleting row:', err);
        setMessage({ type: 'error', text: 'Error al eliminar la fila' });
      }
    }
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get(`/api/download/${encodeURIComponent(filename!)}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', decodeURIComponent(filename!));
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
      setMessage({ type: 'error', text: 'Error al descargar el archivo' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-primary-color">
          {decodeURIComponent(filename || '')}
        </h2>
        <div className="flex gap-2">
          <button onClick={() => navigate('/')} className="btn btn-secondary">Volver</button>
          <button onClick={handleDownload} className="btn btn-primary">Descargar CSV</button>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">Agregar Fila</button>
        </div>
      </div>

      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      {loading ? (
        <p className="text-center py-8">Cargando datos...</p>
      ) : error ? (
        <p className="text-center py-8 text-error-color">{error}</p>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                {headers.map((header, index) => (
                  <th key={header}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{header}</span>
                      <div className="column-actions">
                        <button className="column-action-btn" onClick={() => moveColumn(index, 'up')} disabled={index === 0 || saving} title="Mover arriba">▲</button>
                        <button className="column-action-btn" onClick={() => moveColumn(index, 'down')} disabled={index === headers.length - 1 || saving} title="Mover abajo">▼</button>
                        <button className="column-action-btn" onClick={() => deleteColumn(index)} disabled={saving} title="Eliminar columna">✕</button>
                      </div>
                    </div>
                  </th>
                ))}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {headers.map((header) => (
                    <td key={header}>{row[header]}</td>
                  ))}
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditRow(rowIndex)} className="btn btn-secondary">Editar</button>
                      <button onClick={() => handleDeleteRow(rowIndex)} className="btn btn-danger">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Agregar Nueva Fila</h3>
              <button onClick={() => setShowAddModal(false)} className="modal-close">&times;</button>
            </div>
            <div className="modal-body">
              {headers.map((header, index) => (
                <div key={index} className="form-group">
                  <label className="form-label">{header}</label>
                  <input type="text" name={header} value={formData[header] || ''} onChange={handleInputChange} className="form-input" />
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancelar</button>
              <button onClick={handleAddRow} className="btn btn-primary">Agregar</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Editar Fila</h3>
              <button onClick={() => setShowEditModal(false)} className="modal-close">&times;</button>
            </div>
            <div className="modal-body">
              {headers.map((header, index) => (
                <div key={index} className="form-group">
                  <label className="form-label">{header}</label>
                  <input type="text" name={header} value={formData[header] || ''} onChange={handleInputChange} className="form-input" />
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancelar</button>
              <button onClick={handleUpdateRow} className="btn btn-primary">Actualizar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CsvViewer;