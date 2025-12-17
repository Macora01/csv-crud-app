const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Asegurar que el directorio de uploads exista
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// Función de ayuda para crear un csvWriter
// ¡IMPORTANTE! Siempre forzamos el delimitador a coma (',') al escribir.
const getCsvWriter = (filePath, headers) => {
  return createCsvWriter({
    path: filePath,
    header: headers.map(h => ({ id: h, title: h })),
    delimiter: ',' // <-- SIEMPRE USAREMOS COMA PARA GUARDAR
  });
};

// Obtener lista de archivos CSV
app.get('/api/files', (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error al leer directorio' });
    }
    const csvFiles = files.filter(file => {
      const filePath = path.join(uploadsDir, file);
      return file.endsWith('.csv') && fs.statSync(filePath).isFile();
    });
    res.json(csvFiles);
  });
});

// Obtener datos de un archivo CSV específico con un separador
app.get('/api/file/:filename', (req, res) => {
  const filename = req.params.filename;
  const separator = req.query.separator || ',';
  const filePath = path.join(uploadsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }
  
  const results = [];
  fs.createReadStream(filePath)
    .pipe(csv({ separator }))
    .on('data', (data) => results.push(data))
    .on('end', () => {
      res.json(results);
    })
    .on('error', (err) => {
        res.status(500).json({ error: 'Error al leer el archivo', details: err.message });
    });
});

// Subir un nuevo archivo CSV
app.post('/api/upload', upload.single('csvFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se ha subido ningún archivo' });
  }
  res.json({ message: 'Archivo subido exitosamente', filename: req.file.originalname });
});

// Agregar una nueva fila al CSV
app.post('/api/file/:filename/row', (req, res) => {
  const { newRow } = req.body; // Ya no necesitamos el separador del frontend
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }
  
  const results = [];
  fs.createReadStream(filePath)
    .pipe(csv({ separator: ';' })) // Leemos con el separador que elija el usuario
    .on('data', (data) => results.push(data))
    .on('end', () => {
      results.push(newRow);
      if (results.length === 0) return res.status(400).json({error: 'No se pudo agregar la fila'});
      const headers = Object.keys(results[0]);
      const csvWriter = getCsvWriter(filePath, headers); // Guardamos con coma
      
      csvWriter.writeRecords(results)
        .then(() => res.json({ message: 'Fila agregada exitosamente y normalizada a coma' }))
        .catch(error => res.status(500).json({ error: 'Error al escribir en el archivo', details: error.message }));
    });
});

// Actualizar una fila específica
app.put('/api/file/:filename/row/:rowIndex', (req, res) => {
  const { updatedRow } = req.body;
  const filename = req.params.filename;
  const rowIndex = parseInt(req.params.rowIndex);
  const filePath = path.join(uploadsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }
  
  const results = [];
  fs.createReadStream(filePath)
    .pipe(csv({ separator: ';' })) // Leemos con el separador que elija el usuario
    .on('data', (data) => results.push(data))
    .on('end', () => {
      if (rowIndex < 0 || rowIndex >= results.length) {
        return res.status(400).json({ error: 'Índice de fila inválido' });
      }
      results[rowIndex] = updatedRow;
      const headers = Object.keys(results[0]);
      const csvWriter = getCsvWriter(filePath, headers); // Guardamos con coma
      
      csvWriter.writeRecords(results)
        .then(() => res.json({ message: 'Fila actualizada exitosamente y normalizada a coma' }))
        .catch(error => res.status(500).json({ error: 'Error al escribir en el archivo', details: error.message }));
    });
});

// Eliminar una fila específica
app.delete('/api/file/:filename/row/:rowIndex', (req, res) => {
  const filename = req.params.filename;
  const rowIndex = parseInt(req.params.rowIndex);
  const filePath = path.join(uploadsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }
  
  const results = [];
  fs.createReadStream(filePath)
    .pipe(csv({ separator: ';' })) // Leemos con el separador que elija el usuario
    .on('data', (data) => results.push(data))
    .on('end', () => {
      if (rowIndex < 0 || rowIndex >= results.length) {
        return res.status(400).json({ error: 'Índice de fila inválido' });
      }
      results.splice(rowIndex, 1);
      
      if (results.length > 0) {
        const headers = Object.keys(results[0]);
        const csvWriter = getCsvWriter(filePath, headers); // Guardamos con coma
        csvWriter.writeRecords(results)
          .then(() => res.json({ message: 'Fila eliminada exitosamente y normalizada a coma' }))
          .catch(error => res.status(500).json({ error: 'Error al escribir en el archivo', details: error.message }));
      } else {
        res.json({ message: 'Fila eliminada exitosamente' });
      }
    });
});

// Actualizar la estructura completa del archivo (reordenar/eliminar columnas)
app.put('/api/file/:filename/structure', (req, res) => {
  const { newData } = req.body; // Ya no necesitamos el separador del frontend
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }

  if (!Array.isArray(newData) || newData.length === 0) {
    return res.status(400).json({ error: 'No se proporcionaron datos para actualizar' });
  }

  try {
    const newHeaders = Object.keys(newData[0]);
    const csvWriter = getCsvWriter(filePath, newHeaders); // Guardamos con coma
    csvWriter.writeRecords(newData)
      .then(() => res.json({ message: 'Estructura y datos del archivo actualizados y normalizados a coma' }))
      .catch(error => res.status(500).json({ error: 'Error al actualizar la estructura del archivo', details: error.message }));
  } catch (error) {
    console.error('Error updating file structure:', error);
    res.status(500).json({ error: 'Error al actualizar la estructura del archivo' });
  }
});

// Ruta para archivar (mover) un archivo
app.post('/api/file/:filename/archive', (req, res) => {
  const filename = req.params.filename;
  const sourcePath = path.join(uploadsDir, filename);
  const archiveDir = path.join(uploadsDir, 'archive');

  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir);
  }

  const destinationPath = path.join(archiveDir, filename);

  if (!fs.existsSync(sourcePath)) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }

  fs.rename(sourcePath, destinationPath, (err) => {
    if (err) {
      console.error('Error archiving file:', err);
      return res.status(500).json({ error: 'Error al archivar el archivo' });
    }
    res.json({ message: 'Archivo archivado exitosamente' });
  });
});

// Descargar el archivo CSV
app.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }
  
  res.download(filePath, filename, (err) => {
    if (err) {
      res.status(500).json({ error: 'Error al descargar el archivo' });
    }
  });
});

// CÓDIGO DE PRODUCCIÓN (solo se ejecuta en producción)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});