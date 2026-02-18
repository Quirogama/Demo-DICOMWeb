const express = require('express');
const db = require('../database');

const router = express.Router();

/**
 * QIDO-RS: Search for Studies
 * GET /dicomweb/studies
 * Parámetros query opcionales: PatientName, PatientID, StudyDate, AccessionNumber
 */
router.get('/studies', async (req, res) => {
  try {
    const criteria = {};
    
    // Extraer parámetros de búsqueda
    if (req.query.PatientName) {
      criteria.PatientName = req.query.PatientName;
    }
    if (req.query.PatientID) {
      criteria.PatientID = req.query.PatientID;
    }
    if (req.query.StudyDate) {
      criteria.StudyDate = req.query.StudyDate;
    }
    if (req.query.AccessionNumber) {
      criteria.AccessionNumber = req.query.AccessionNumber;
    }

    // Si no hay criterios, obtener todos los estudios
    const studies = Object.keys(criteria).length > 0 
      ? await db.searchStudies(criteria)
      : await db.getAllStudies();

    // Formatear respuesta DICOMWeb JSON
    const response = studies.map(study => ({
      "00100010": { // Patient Name
        "vr": "PN",
        "Value": [{ "Alphabetic": study.patient_name }]
      },
      "00100020": { // Patient ID
        "vr": "LO",
        "Value": [study.patient_id]
      },
      "0020000D": { // Study Instance UID
        "vr": "UI",
        "Value": [study.study_instance_uid]
      },
      "00080020": { // Study Date
        "vr": "DA",
        "Value": [study.study_date]
      },
      "00080030": { // Study Time
        "vr": "TM",
        "Value": [study.study_time]
      },
      "00081030": { // Study Description
        "vr": "LO",
        "Value": [study.study_description]
      },
      "00080050": { // Accession Number
        "vr": "SH",
        "Value": [study.accession_number]
      }
    }));

    res.json({
      status: 'success',
      count: studies.length,
      criteria: criteria,
      results: studies,
      dicomWebResponse: response
    });

  } catch (error) {
    console.error('Error en QIDO-RS search studies:', error);
    res.status(500).json({
      error: 'Error al buscar estudios',
      message: error.message
    });
  }
});

/**
 * QIDO-RS: Search for Series within a Study
 * GET /dicomweb/studies/{studyInstanceUID}/series
 * Parámetros query opcionales: Modality, SeriesNumber
 */
router.get('/studies/:studyUID/series', async (req, res) => {
  try {
    const { studyUID } = req.params;
    
    // Obtener todas las series del estudio
    let series = await db.getSeriesByStudy(studyUID);

    // Filtrar por Modality si se proporciona
    if (req.query.Modality) {
      series = series.filter(s => s.modality === req.query.Modality);
    }

    // Filtrar por SeriesNumber si se proporciona
    if (req.query.SeriesNumber) {
      series = series.filter(s => s.series_number === parseInt(req.query.SeriesNumber));
    }

    // Formatear respuesta DICOMWeb JSON
    const response = series.map(serie => ({
      "0020000D": { // Study Instance UID
        "vr": "UI",
        "Value": [serie.study_instance_uid]
      },
      "0020000E": { // Series Instance UID
        "vr": "UI",
        "Value": [serie.series_instance_uid]
      },
      "00080060": { // Modality
        "vr": "CS",
        "Value": [serie.modality]
      },
      "00200011": { // Series Number
        "vr": "IS",
        "Value": [serie.series_number.toString()]
      },
      "0008103E": { // Series Description
        "vr": "LO",
        "Value": [serie.series_description]
      }
    }));

    res.json({
      status: 'success',
      studyInstanceUID: studyUID,
      count: series.length,
      results: series,
      dicomWebResponse: response
    });

  } catch (error) {
    console.error('Error en QIDO-RS search series:', error);
    res.status(500).json({
      error: 'Error al buscar series',
      message: error.message
    });
  }
});

/**
 * QIDO-RS: Search for Instances within a Series
 * GET /dicomweb/studies/{studyInstanceUID}/series/{seriesInstanceUID}/instances
 */
router.get('/studies/:studyUID/series/:seriesUID/instances', async (req, res) => {
  try {
    const { seriesUID } = req.params;
    
    const instances = await db.getInstancesBySeries(seriesUID);

    // Formatear respuesta DICOMWeb JSON
    const response = instances.map(instance => {
      const metadata = JSON.parse(instance.metadata);
      return {
        "0020000D": metadata["0020000D"], // Study Instance UID
        "0020000E": metadata["0020000E"], // Series Instance UID
        "00080018": metadata["00080018"], // SOP Instance UID
        "00200013": metadata["00200013"], // Instance Number
        "00080060": metadata["00080060"]  // Modality
      };
    });

    res.json({
      status: 'success',
      count: instances.length,
      results: instances.map(inst => ({
        sop_instance_uid: inst.sop_instance_uid,
        instance_number: inst.instance_number,
        file_size: inst.file_size,
        created_at: inst.created_at
      })),
      dicomWebResponse: response
    });

  } catch (error) {
    console.error('Error en QIDO-RS search instances:', error);
    res.status(500).json({
      error: 'Error al buscar instancias',
      message: error.message
    });
  }
});

/**
 * Endpoint adicional: Obtener estadísticas generales
 * GET /dicomweb/statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const studies = await db.getAllStudies();
    const allSeries = [];
    const allInstances = [];

    for (const study of studies) {
      const series = await db.getSeriesByStudy(study.study_instance_uid);
      allSeries.push(...series);
      
      for (const serie of series) {
        const instances = await db.getInstancesBySeries(serie.series_instance_uid);
        allInstances.push(...instances);
      }
    }

    // Calcular tamaño total
    const totalSize = allInstances.reduce((sum, inst) => sum + (inst.file_size || 0), 0);

    res.json({
      status: 'success',
      statistics: {
        totalStudies: studies.length,
        totalSeries: allSeries.length,
        totalInstances: allInstances.length,
        totalSizeBytes: totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
      },
      patients: [...new Set(studies.map(s => s.patient_id))].length,
      modalities: [...new Set(allSeries.map(s => s.modality))]
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas',
      message: error.message
    });
  }
});

module.exports = router;
