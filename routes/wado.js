const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../database');

const router = express.Router();

/**
 * WADO-RS: Retrieve Study
 * GET /dicomweb/studies/{studyInstanceUID}
 * Retorna todos los metadatos del estudio
 */
router.get('/studies/:studyUID', async (req, res) => {
  try {
    const { studyUID } = req.params;
    
    // Obtener estudio
    const study = await db.getStudyByUID(studyUID);
    if (!study) {
      return res.status(404).json({
        error: 'Estudio no encontrado',
        studyInstanceUID: studyUID
      });
    }

    // Obtener todas las series del estudio
    const series = await db.getSeriesByStudy(studyUID);
    
    // Obtener todas las instancias
    const instances = [];
    for (const serie of series) {
      const seriesInstances = await db.getInstancesBySeries(serie.series_instance_uid);
      instances.push(...seriesInstances);
    }

    res.json({
      study: study,
      series: series,
      instances: instances.map(inst => ({
        sop_instance_uid: inst.sop_instance_uid,
        series_instance_uid: inst.series_instance_uid,
        instance_number: inst.instance_number,
        file_size: inst.file_size,
        metadata: JSON.parse(inst.metadata)
      }))
    });

  } catch (error) {
    console.error('Error en WADO-RS retrieve study:', error);
    res.status(500).json({
      error: 'Error al recuperar el estudio',
      message: error.message
    });
  }
});

/**
 * WADO-RS: Retrieve Series
 * GET /dicomweb/studies/{studyInstanceUID}/series/{seriesInstanceUID}
 */
router.get('/studies/:studyUID/series/:seriesUID', async (req, res) => {
  try {
    const { studyUID, seriesUID } = req.params;
    
    const series = await db.getSeriesByUID(seriesUID);
    if (!series) {
      return res.status(404).json({
        error: 'Serie no encontrada'
      });
    }

    const instances = await db.getInstancesBySeries(seriesUID);

    res.json({
      series: series,
      instances: instances.map(inst => ({
        sop_instance_uid: inst.sop_instance_uid,
        instance_number: inst.instance_number,
        file_size: inst.file_size,
        metadata: JSON.parse(inst.metadata)
      }))
    });

  } catch (error) {
    console.error('Error en WADO-RS retrieve series:', error);
    res.status(500).json({
      error: 'Error al recuperar la serie',
      message: error.message
    });
  }
});

/**
 * WADO-RS: Retrieve Instance (Archivo DICOM completo)
 * GET /dicomweb/studies/{studyInstanceUID}/series/{seriesInstanceUID}/instances/{sopInstanceUID}
 */
router.get('/studies/:studyUID/series/:seriesUID/instances/:instanceUID', async (req, res) => {
  try {
    const { instanceUID } = req.params;
    
    const instance = await db.getInstanceByUID(instanceUID);
    if (!instance) {
      return res.status(404).json({
        error: 'Instancia no encontrada'
      });
    }

    // Verificar que el archivo existe
    if (!fs.existsSync(instance.file_path)) {
      return res.status(404).json({
        error: 'Archivo DICOM no encontrado en el sistema',
        sopInstanceUID: instanceUID
      });
    }

    // Devolver el archivo DICOM
    res.setHeader('Content-Type', 'application/dicom');
    res.setHeader('Content-Disposition', `attachment; filename="${instance.sop_instance_uid}.dcm"`);
    res.sendFile(path.resolve(instance.file_path));

  } catch (error) {
    console.error('Error en WADO-RS retrieve instance:', error);
    res.status(500).json({
      error: 'Error al recuperar la instancia',
      message: error.message
    });
  }
});

/**
 * WADO-RS: Retrieve Instance Metadata (JSON)
 * GET /dicomweb/studies/{studyInstanceUID}/series/{seriesInstanceUID}/instances/{sopInstanceUID}/metadata
 */
router.get('/studies/:studyUID/series/:seriesUID/instances/:instanceUID/metadata', async (req, res) => {
  try {
    const { instanceUID } = req.params;
    
    const instance = await db.getInstanceByUID(instanceUID);
    if (!instance) {
      return res.status(404).json({
        error: 'Instancia no encontrada'
      });
    }

    // Devolver metadatos en formato DICOMWeb JSON
    res.json({
      sopInstanceUID: instance.sop_instance_uid,
      seriesInstanceUID: instance.series_instance_uid,
      studyInstanceUID: instance.study_instance_uid,
      instanceNumber: instance.instance_number,
      fileSize: instance.file_size,
      transferSyntaxUID: instance.transfer_syntax_uid,
      metadata: JSON.parse(instance.metadata)
    });

  } catch (error) {
    console.error('Error en WADO-RS retrieve metadata:', error);
    res.status(500).json({
      error: 'Error al recuperar los metadatos',
      message: error.message
    });
  }
});

/**
 * Endpoint adicional: Descargar archivo DICOM por SOP Instance UID
 * GET /dicomweb/instances/{sopInstanceUID}/file
 */
router.get('/instances/:instanceUID/file', async (req, res) => {
  try {
    const { instanceUID } = req.params;
    
    const instance = await db.getInstanceByUID(instanceUID);
    if (!instance) {
      return res.status(404).json({
        error: 'Instancia no encontrada',
        sopInstanceUID: instanceUID
      });
    }

    if (!fs.existsSync(instance.file_path)) {
      return res.status(404).json({
        error: 'Archivo no encontrado en el sistema'
      });
    }

    res.setHeader('Content-Type', 'application/dicom');
    res.setHeader('Content-Disposition', `attachment; filename="${instance.sop_instance_uid}.dcm"`);
    res.sendFile(path.resolve(instance.file_path));

  } catch (error) {
    console.error('Error al descargar archivo:', error);
    res.status(500).json({
      error: 'Error al descargar el archivo',
      message: error.message
    });
  }
});

module.exports = router;
