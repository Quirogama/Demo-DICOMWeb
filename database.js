const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Crear directorio de base de datos si no existe
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(path.join(dbDir, 'dicomweb.db'), (err) => {
  if (err) {
    console.error('Error al crear base de datos:', err);
  } else {
    console.log('✅ Base de datos SQLite conectada');
  }
});

// Serializar para ejecutar las consultas en orden
db.serialize(() => {
  // Crear tabla para almacenar metadatos DICOM
  db.run(`
    CREATE TABLE IF NOT EXISTS studies (
      study_instance_uid TEXT PRIMARY KEY,
      study_date TEXT,
      study_time TEXT,
      study_description TEXT,
      patient_name TEXT,
      patient_id TEXT,
      accession_number TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS series (
      series_instance_uid TEXT PRIMARY KEY,
      study_instance_uid TEXT,
      modality TEXT,
      series_number INTEGER,
      series_description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (study_instance_uid) REFERENCES studies(study_instance_uid)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS instances (
      sop_instance_uid TEXT PRIMARY KEY,
      series_instance_uid TEXT,
      study_instance_uid TEXT,
      instance_number INTEGER,
      file_path TEXT,
      file_size INTEGER,
      transfer_syntax_uid TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (series_instance_uid) REFERENCES series(series_instance_uid),
      FOREIGN KEY (study_instance_uid) REFERENCES studies(study_instance_uid)
    )
  `);

  // Índices para mejorar el rendimiento
  db.run(`CREATE INDEX IF NOT EXISTS idx_series_study ON series(study_instance_uid)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_instances_series ON instances(series_instance_uid)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_instances_study ON instances(study_instance_uid)`);
});

// Funciones para manipular la base de datos con Promesas
const dbOperations = {
  // Guardar estudio
  saveStudy: (studyData) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO studies 
        (study_instance_uid, study_date, study_time, study_description, patient_name, patient_id, accession_number)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        studyData.studyInstanceUID,
        studyData.studyDate,
        studyData.studyTime,
        studyData.studyDescription,
        studyData.patientName,
        studyData.patientID,
        studyData.accessionNumber,
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes, lastID: this.lastID });
        }
      );
      
      stmt.finalize();
    });
  },

  // Guardar serie
  saveSeries: (seriesData) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO series 
        (series_instance_uid, study_instance_uid, modality, series_number, series_description)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        seriesData.seriesInstanceUID,
        seriesData.studyInstanceUID,
        seriesData.modality,
        seriesData.seriesNumber,
        seriesData.seriesDescription,
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes, lastID: this.lastID });
        }
      );
      
      stmt.finalize();
    });
  },

  // Guardar instancia
  saveInstance: (instanceData) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO instances 
        (sop_instance_uid, series_instance_uid, study_instance_uid, instance_number, file_path, file_size, transfer_syntax_uid, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        instanceData.sopInstanceUID,
        instanceData.seriesInstanceUID,
        instanceData.studyInstanceUID,
        instanceData.instanceNumber,
        instanceData.filePath,
        instanceData.fileSize,
        instanceData.transferSyntaxUID,
        JSON.stringify(instanceData.metadata),
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes, lastID: this.lastID });
        }
      );
      
      stmt.finalize();
    });
  },

  // Consultar todos los estudios
  getAllStudies: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM studies ORDER BY created_at DESC', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Consultar estudio por UID
  getStudyByUID: (studyInstanceUID) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM studies WHERE study_instance_uid = ?', [studyInstanceUID], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Consultar series de un estudio
  getSeriesByStudy: (studyInstanceUID) => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM series WHERE study_instance_uid = ?', [studyInstanceUID], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Consultar serie por UID
  getSeriesByUID: (seriesInstanceUID) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM series WHERE series_instance_uid = ?', [seriesInstanceUID], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Consultar instancias de una serie
  getInstancesBySeries: (seriesInstanceUID) => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM instances WHERE series_instance_uid = ?', [seriesInstanceUID], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Consultar instancia por UID
  getInstanceByUID: (sopInstanceUID) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM instances WHERE sop_instance_uid = ?', [sopInstanceUID], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Buscar estudios por criterios
  searchStudies: (criteria) => {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM studies WHERE 1=1';
      const params = [];

      if (criteria.PatientName) {
        query += ' AND patient_name LIKE ?';
        params.push(`%${criteria.PatientName}%`);
      }
      if (criteria.PatientID) {
        query += ' AND patient_id = ?';
        params.push(criteria.PatientID);
      }
      if (criteria.StudyDate) {
        query += ' AND study_date = ?';
        params.push(criteria.StudyDate);
      }
      if (criteria.AccessionNumber) {
        query += ' AND accession_number = ?';
        params.push(criteria.AccessionNumber);
      }

      query += ' ORDER BY created_at DESC';
      
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

module.exports = dbOperations;
