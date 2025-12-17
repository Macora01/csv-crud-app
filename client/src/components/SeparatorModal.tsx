import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface SeparatorModalProps {
  filename: string;
  onClose: () => void;
}

const SeparatorModal: React.FC<SeparatorModalProps> = ({ filename, onClose }) => {
  const navigate = useNavigate();
  const [separator, setSeparator] = useState(',');

  const handleConfirm = () => {
    navigate(`/file/${encodeURIComponent(filename)}`, { state: { separator } });
    onClose();
  };

  return (
    <div className="modal">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Elegir Separador</h3>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>
        <div className="modal-body">
          <p>¿Cuál es el separador de columnas en el archivo <strong>{decodeURIComponent(filename)}</strong>?</p>
          <div className="form-group">
            <label className="form-label">Separador:</label>
            <select 
              value={separator} 
              onChange={(e) => setSeparator(e.target.value)}
              className="form-input"
            >
              <option value=",">Coma (,)</option>
              <option value=";">Punto y Coma (;)</option>
              <option value="\t">Tabulador</option>
              <option value="|">Barra Vertical (|)</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">Cancelar</button>
          <button onClick={handleConfirm} className="btn btn-primary">Confirmar</button>
        </div>
      </div>
    </div>
  );
};

export default SeparatorModal;