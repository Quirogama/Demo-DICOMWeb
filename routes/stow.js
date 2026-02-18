const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { extractDicomMetadata, metadataToDicomWebJson } = require('../dicomUtils');
const db = require('../database');

const router = express.Router();

// Configurar almacenamiento de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Usar UUID para evitar conflictos de nombres
    const uniqueName = `${uuidv4()}.dcm`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Aceptar archivos DICOM (sin extensión o .dcm)
    if (file.originalname.endsWith('.dcm') || 
        file.mimetype === 'application/dicom' ||
        file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(null, true); // Aceptar todos por ahora
    }
  }
});

/**
 * STOW-RS: Store instances (Guardar imágenes DICOM)
 * POST /dicomweb/studies
 * Acepta multipart/related o multipart/form-data
 */
router.post('/studies', upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No se enviaron archivos',
        message: 'Debe enviar al menos un archivo DICOM'
      });
    }

    const results = [];
    const errors = [];

    for (const file of req.files) {
      try {
        // Extraer metadatos del archivo DICOM
        const metadata = extractDicomMetadata(file.path);

        // Guardar estudio
        await db.saveStudy({
          studyInstanceUID: metadata.studyInstanceUID,
          studyDate: metadata.studyDate,
          studyTime: metadata.studyTime,
          studyDescription: metadata.studyDescription,
          patientName: metadata.patientName,
          patientID: metadata.patientID,
          accessionNumber: metadata.accessionNumber
        });

        // Guardar serie
        await db.saveSeries({
          seriesInstanceUID: metadata.seriesInstanceUID,
          studyInstanceUID: metadata.studyInstanceUID,
          modality: metadata.modality,
          seriesNumber: parseInt(metadata.seriesNumber),
          seriesDescription: metadata.seriesDescription
        });

        // Guardar instancia
        await db.saveInstance({
          sopInstanceUID: metadata.sopInstanceUID,
          seriesInstanceUID: metadata.seriesInstanceUID,
          studyInstanceUID: metadata.studyInstanceUID,
          instanceNumber: parseInt(metadata.instanceNumber),
          filePath: file.path,
          fileSize: file.size,
          transferSyntaxUID: metadata.transferSyntaxUID,
          metadata: metadataToDicomWebJson(metadata)
        });

        results.push({
          success: true,
          fileName: file.originalname,
          sopInstanceUID: metadata.sopInstanceUID,
          studyInstanceUID: metadata.studyInstanceUID,
          seriesInstanceUID: metadata.seriesInstanceUID
        });

      } catch (error) {
        errors.push({
          fileName: file.originalname,
          error: error.message
        });
        // Eliminar archivo si hubo error
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    // Respuesta en formato DICOMWeb
    const response = {
      "00081190": { // Retrieve URL
        "vr": "UR",
        "Value": [`${req.protocol}://${req.get('host')}/dicomweb`]
      },
      "00081198": { // Failed SOP Sequence
        "vr": "SQ",
        "Value": errors
      },
      "00081199": { // Referenced SOP Sequence  
        "vr": "SQ",
        "Value": results
      }
    };

    res.status(200).json({
      status: 'success',
      message: `${results.length} archivos guardados exitosamente, ${errors.length} errores`,
      results: results,
      errors: errors.length > 0 ? errors : undefined,
      dicomWebResponse: response
    });

  } catch (error) {
    console.error('Error en STOW-RS:', error);
    res.status(500).json({
      error: 'Error al procesar los archivos',
      message: error.message
    });
  }
});

/**
 * STOW-RS: Store instances a un estudio específico
 * POST /dicomweb/studies/{studyInstanceUID}
 */
router.post('/studies/:studyUID', upload.array('files'), async (req, res) => {
  const { studyUID } = req.params;
  
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No se enviaron archivos'
      });
    }

    const results = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const metadata = extractDicomMetadata(file.path);

        // Verificar que el Study UID coincide
        if (metadata.studyInstanceUID !== studyUID) {
          throw new Error(`El Study UID del archivo no coincide con el especificado en la URL`);
        }

        // Guardar en base de datos
        await db.saveStudy({
          studyInstanceUID: metadata.studyInstanceUID,
          studyDate: metadata.studyDate,
          studyTime: metadata.studyTime,
          studyDescription: metadata.studyDescription,
          patientName: metadata.patientName,
          patientID: metadata.patientID,
          accessionNumber: metadata.accessionNumber
        });

        await db.saveSeries({
          seriesInstanceUID: metadata.seriesInstanceUID,
          studyInstanceUID: metadata.studyInstanceUID,
          modality: metadata.modality,
          seriesNumber: parseInt(metadata.seriesNumber),
          seriesDescription: metadata.seriesDescription
        });

        await db.saveInstance({
          sopInstanceUID: metadata.sopInstanceUID,
          seriesInstanceUID: metadata.seriesInstanceUID,
          studyInstanceUID: metadata.studyInstanceUID,
          instanceNumber: parseInt(metadata.instanceNumber),
          filePath: file.path,
          fileSize: file.size,
          transferSyntaxUID: metadata.transferSyntaxUID,
          metadata: metadataToDicomWebJson(metadata)
        });

        results.push({
          success: true,
          fileName: file.originalname,
          sopInstanceUID: metadata.sopInstanceUID
        });

      } catch (error) {
        errors.push({
          fileName: file.originalname,
          error: error.message
        });
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    res.status(200).json({
      status: 'success',
      studyInstanceUID: studyUID,
      results: results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error en STOW-RS:', error);
    res.status(500).json({
      error: 'Error al procesar los archivos',
      message: error.message
    });
  }
});

module.exports = router;
