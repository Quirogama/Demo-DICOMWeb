const dicomParser = require('dicom-parser');
const fs = require('fs');

// Tags DICOM comunes
const DICOM_TAGS = {
  PatientName: 'x00100010',
  PatientID: 'x00100020',
  StudyInstanceUID: 'x0020000d',
  SeriesInstanceUID: 'x0020000e',
  SOPInstanceUID: 'x00080018',
  StudyDate: 'x00080020',
  StudyTime: 'x00080030',
  StudyDescription: 'x00081030',
  SeriesNumber: 'x00200011',
  SeriesDescription: 'x0008103e',
  InstanceNumber: 'x00200013',
  Modality: 'x00080060',
  AccessionNumber: 'x00080050',
  TransferSyntaxUID: 'x00020010'
};

/**
 * Parsear archivo DICOM y extraer metadatos
 */
function parseDicomFile(filePath) {
  try {
    const dicomFileAsBuffer = fs.readFileSync(filePath);
    const byteArray = new Uint8Array(dicomFileAsBuffer);
    const dataSet = dicomParser.parseDicom(byteArray);

    return dataSet;
  } catch (error) {
    throw new Error(`Error parseando archivo DICOM: ${error.message}`);
  }
}

/**
 * Obtener valor de un tag DICOM
 */
function getTagValue(dataSet, tag) {
  try {
    const element = dataSet.elements[tag];
    if (!element) return null;

    // Intentar obtener el valor como String
    try {
      return dataSet.string(tag);
    } catch (e) {
      // Si falla, intentar como número
      try {
        return dataSet.intString(tag);
      } catch (e2) {
        return null;
      }
    }
  } catch (error) {
    return null;
  }
}

/**
 * Extraer metadatos principales del DICOM
 */
function extractDicomMetadata(filePath) {
  const dataSet = parseDicomFile(filePath);
  
  const metadata = {
    // Información del paciente
    patientName: getTagValue(dataSet, DICOM_TAGS.PatientName) || 'UNKNOWN',
    patientID: getTagValue(dataSet, DICOM_TAGS.PatientID) || 'UNKNOWN',
    
    // Información del estudio
    studyInstanceUID: getTagValue(dataSet, DICOM_TAGS.StudyInstanceUID),
    studyDate: getTagValue(dataSet, DICOM_TAGS.StudyDate),
    studyTime: getTagValue(dataSet, DICOM_TAGS.StudyTime),
    studyDescription: getTagValue(dataSet, DICOM_TAGS.StudyDescription) || '',
    accessionNumber: getTagValue(dataSet, DICOM_TAGS.AccessionNumber) || '',
    
    // Información de la serie
    seriesInstanceUID: getTagValue(dataSet, DICOM_TAGS.SeriesInstanceUID),
    seriesNumber: getTagValue(dataSet, DICOM_TAGS.SeriesNumber) || '0',
    seriesDescription: getTagValue(dataSet, DICOM_TAGS.SeriesDescription) || '',
    modality: getTagValue(dataSet, DICOM_TAGS.Modality) || 'OT',
    
    // Información de la instancia
    sopInstanceUID: getTagValue(dataSet, DICOM_TAGS.SOPInstanceUID),
    instanceNumber: getTagValue(dataSet, DICOM_TAGS.InstanceNumber) || '0',
    transferSyntaxUID: getTagValue(dataSet, DICOM_TAGS.TransferSyntaxUID) || ''
  };

  // Validar UIDs obligatorios
  if (!metadata.studyInstanceUID || !metadata.seriesInstanceUID || !metadata.sopInstanceUID) {
    throw new Error('Archivo DICOM inválido: faltan UIDs obligatorios');
  }

  return metadata;
}

/**
 * Convertir DICOM a JSON (DICOMWeb JSON Model)
 */
function dicomToJson(filePath) {
  const dataSet = parseDicomFile(filePath);
  const json = {};

  // Iterar sobre todos los elementos del dataset
  Object.keys(dataSet.elements).forEach(tag => {
    try {
      const element = dataSet.elements[tag];
      const value = getTagValue(dataSet, tag);
      
      if (value !== null) {
        // Formato DICOMWeb JSON Model
        json[tag] = {
          vr: element.vr || 'UN', // Value Representation
          Value: [value]
        };
      }
    } catch (error) {
      // Ignorar errores en tags específicos
    }
  });

  return json;
}

/**
 * Convertir metadatos a formato DICOMWeb JSON
 */
function metadataToDicomWebJson(metadata) {
  return {
    "00100010": { // Patient Name
      "vr": "PN",
      "Value": [{ "Alphabetic": metadata.patientName }]
    },
    "00100020": { // Patient ID
      "vr": "LO",
      "Value": [metadata.patientID]
    },
    "0020000D": { // Study Instance UID
      "vr": "UI",
      "Value": [metadata.studyInstanceUID]
    },
    "0020000E": { // Series Instance UID
      "vr": "UI",
      "Value": [metadata.seriesInstanceUID]
    },
    "00080018": { // SOP Instance UID
      "vr": "UI",
      "Value": [metadata.sopInstanceUID]
    },
    "00080020": { // Study Date
      "vr": "DA",
      "Value": [metadata.studyDate]
    },
    "00080030": { // Study Time
      "vr": "TM",
      "Value": [metadata.studyTime]
    },
    "00081030": { // Study Description
      "vr": "LO",
      "Value": [metadata.studyDescription]
    },
    "00080060": { // Modality
      "vr": "CS",
      "Value": [metadata.modality]
    },
    "00200011": { // Series Number
      "vr": "IS",
      "Value": [metadata.seriesNumber]
    },
    "0008103E": { // Series Description
      "vr": "LO",
      "Value": [metadata.seriesDescription]
    },
    "00200013": { // Instance Number
      "vr": "IS",
      "Value": [metadata.instanceNumber]
    },
    "00080050": { // Accession Number
      "vr": "SH",
      "Value": [metadata.accessionNumber]
    }
  };
}

module.exports = {
  parseDicomFile,
  extractDicomMetadata,
  dicomToJson,
  metadataToDicomWebJson,
  getTagValue,
  DICOM_TAGS
};
