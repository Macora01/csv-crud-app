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
const PORT = process.env.PORT || 5000;

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

// Obtener lista de archivos CSV
app.get('/api/files', (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error al leer directorio' });
    }
    const csvFiles = files.filter(file => file.endsWith('.csv'));
    res.json(csvFiles);
  });
});

// Obtener datos de un archivo CSV específico
app.get('/api/file/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }
  
  const results = [];
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      res.json(results);
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
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  const newRow = req.body;
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }
  
  // Leer el archivo existente
  const results = [];
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      // Agregar la nueva fila
      results.push(newRow);
      
      // Obtener los encabezados del CSV
      const headers = Object.keys(results[0]);
      
      // Escribir el archivo actualizado
      const csvWriter = createCsvWriter({
        path: filePath,
        header: headers.map(h => ({id: h, title: h}))
      });
      
      csvWriter.writeRecords(results)
        .then(() => {
          res.json({ message: 'Fila agregada exitosamente' });
        })
        .catch(error => {
          res.status(500).json({ error: 'Error al escribir en el archivo' });
        });
    });
});

// Actualizar una fila específica
app.put('/api/file/:filename/row/:rowIndex', (req, res) => {
  const filename = req.params.filename;
  const rowIndex = parseInt(req.params.rowIndex);
  const updatedRow = req.body;
  const filePath = path.join(uploadsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }
  
  // Leer el archivo existente
  const results = [];
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      // Validar que el índice sea válido
      if (rowIndex < 0 || rowIndex >= results.length) {
        return res.status(400).json({ error: 'Índice de fila inválido' });
      }
      
      // Actualizar la fila
      results[rowIndex] = updatedRow;
      
      // Obtener los encabezados del CSV
      const headers = Object.keys(results[0]);
      
      // Escribir el archivo actualizado
      const csvWriter = createCsvWriter({
        path: filePath,
        header: headers.map(h => ({id: h, title: h}))
      });
      
      csvWriter.writeRecords(results)
        .then(() => {
          res.json({ message: 'Fila actualizada exitosamente' });
        })
        .catch(error => {
          res.status(500).json({ error: 'Error al escribir en el archivo' });
        });
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
  
  // Leer el archivo existente
  const results = [];
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      // Validar que el índice sea válido
      if (rowIndex < 0 || rowIndex >= results.length) {
        return res.status(400).json({ error: 'Índice de fila inválido' });
      }
      
      // Eliminar la fila
      results.splice(rowIndex, 1);
      
      // Si no quedan filas, mantener solo los encabezados
      if (results.length === 0) {
        return res.json({ message: 'Fila eliminada exitosamente' });
      }
      
      // Obtener los encabezados del CSV
      const headers = Object.keys(results[0]);
      
      // Escribir el archivo actualizado
      const csvWriter = createCsvWriter({
        path: filePath,
        header: headers.map(h => ({id: h, title: h}))
      });
      
      csvWriter.writeRecords(results)
        .then(() => {
          res.json({ message: 'Fila eliminada exitosamente' });
        })
        .catch(error => {
          res.status(500).json({ error: 'Error al escribir en el archivo' });
        });
    });
});

// Descargar el archivo CSV actualizado
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

// ... (deja todo el código de las rutas /api/ como está)

// Servir archivos estáticos de la aplicación React (en producción)
app.use(express.static(path.join(__dirname, 'public')));

// Para cualquier otra ruta que no sea una API, enviar el index.html de React
// Esto es crucial para que React Router maneje la navegación en el cliente
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});