const express = require('express');
const cors = require('cors');
const path = require('path');

// Importar rutas
const stowRoutes = require('./routes/stow');
const wadoRoutes = require('./routes/wado');
const qidoRoutes = require('./routes/qido');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    message: 'API DICOMWeb - Servidor de imágenes médicas',
    version: '1.0.0',
    endpoints: {
      'STOW-RS (Store)': {
        'POST /dicomweb/studies': 'Guardar imágenes DICOM',
        'POST /dicomweb/studies/{studyInstanceUID}': 'Guardar instancias en un estudio específico'
      },
      'WADO-RS (Retrieve)': {
        'GET /dicomweb/studies/{studyInstanceUID}': 'Recuperar estudio completo',
        'GET /dicomweb/studies/{studyUID}/series/{seriesUID}': 'Recuperar serie',
        'GET /dicomweb/studies/{studyUID}/series/{seriesUID}/instances/{instanceUID}': 'Recuperar instancia (archivo DICOM)',
        'GET /dicomweb/studies/{studyUID}/series/{seriesUID}/instances/{instanceUID}/metadata': 'Recuperar metadatos JSON',
        'GET /dicomweb/instances/{instanceUID}/file': 'Descargar archivo DICOM directo'
      },
      'QIDO-RS (Query)': {
        'GET /dicomweb/studies': 'Buscar estudios (query params: PatientName, PatientID, StudyDate, AccessionNumber)',
        'GET /dicomweb/studies/{studyUID}/series': 'Buscar series (query params: Modality, SeriesNumber)',
        'GET /dicomweb/studies/{studyUID}/series/{seriesUID}/instances': 'Buscar instancias',
        'GET /dicomweb/statistics': 'Obtener estadísticas del sistema'
      }
    },
    documentation: 'Consulta el archivo README.md para más información'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Montar rutas DICOMWeb
app.use('/dicomweb', stowRoutes);
app.use('/dicomweb', wadoRoutes);
app.use('/dicomweb', qidoRoutes);

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.path,
    method: req.method
  });
});

// Manejo de errores generales
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('Servidor DICOMWeb API iniciado');
  console.log('='.repeat(50));
  console.log(`Puerto: ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Documentación: http://localhost:${PORT}/`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log('='.repeat(50));
  console.log('Endpoints disponibles:');
  console.log('STOW-RS: POST /dicomweb/studies');
  console.log('WADO-RS: GET /dicomweb/studies/{studyUID}');
  console.log('QIDO-RS: GET /dicomweb/studies');
  console.log('='.repeat(50));
});

module.exports = app;
