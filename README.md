# 🏥 API DICOMWeb - Sistema de Gestión de Imágenes Médicas

![DICOM](https://img.shields.io/badge/DICOM-Medical%20Imaging-blue)
![Node.js](https://img.shields.io/badge/Node.js-v14+-green)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey)

Sistema completo para **enviar, almacenar y recuperar** imágenes médicas en formato **DICOMWeb**. Implementa los estándares STOW-RS, WADO-RS y QIDO-RS con seguridad de archivos y base de datos SQLite.

## 📋 Características

✅ **STOW-RS** - Almacenamiento de imágenes DICOM  
✅ **WADO-RS** - Recuperación de estudios, series e instancias  
✅ **QIDO-RS** - Búsqueda y consulta de metadatos  
✅ **Conversión DICOM a JSON** - Formato DICOMWeb JSON Model  
✅ **Base de datos SQLite** - Almacenamiento de metadatos  
✅ **Sistema de archivos seguro** - Almacenamiento físico de imágenes  
✅ **API REST completa** - Documentada y lista para usar  
✅ **Colección Postman incluida** - Pruebas inmediatas  

## 🚀 Instalación y Configuración

### Requisitos Previos

- **Node.js** v14 o superior
- **npm** (incluido con Node.js)
- **Postman** (ya instalado según tus indicaciones)

### Paso 1: Instalar Dependencias

Abre una terminal en esta carpeta y ejecuta:

\`\`\`powershell
npm install
\`\`\`

Esto instalará:
- **express** - Servidor web
- **multer** - Manejo de archivos
- **dicom-parser** - Parser de archivos DICOM
- **better-sqlite3** - Base de datos SQLite
- **cors** - Soporte CORS
- **uuid** - Generación de identificadores únicos

### Paso 2: Iniciar el Servidor

\`\`\`powershell
npm start
\`\`\`

O para desarrollo con auto-recarga:

\`\`\`powershell
npm run dev
\`\`\`

El servidor estará disponible en: **http://localhost:3001**

### Paso 3: Importar Colección de Postman

1. Abre **Postman**
2. Haz clic en **Import** (esquina superior izquierda)
3. Selecciona el archivo: **DICOMWeb_API.postman_collection.json**
4. La colección aparecerá con todos los endpoints listos para usar

## 📁 Estructura del Proyecto

\`\`\`
API Demo/
├── server.js                          # Servidor principal Express
├── database.js                        # Módulo de base de datos SQLite
├── dicomUtils.js                      # Utilidades DICOM y conversión a JSON
├── package.json                       # Configuración del proyecto
├── routes/
│   ├── stow.js                       # STOW-RS (Store/Guardar)
│   ├── wado.js                       # WADO-RS (Retrieve/Recuperar)
│   └── qido.js                       # QIDO-RS (Query/Buscar)
├── data/
│   └── dicomweb.db                   # Base de datos SQLite (se crea automáticamente)
├── uploads/                           # Archivos DICOM subidos (se crea automáticamente)
└── DICOMWeb_API.postman_collection.json  # Colección de Postman
\`\`\`

## 🔌 Endpoints de la API

### 🟢 General

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Información del servidor |
| GET | `/health` | Health check |
| GET | `/dicomweb/statistics` | Estadísticas del sistema |

### 🔵 STOW-RS (Store - Guardar Imágenes)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/dicomweb/studies` | Guardar archivos DICOM |
| POST | `/dicomweb/studies/{studyUID}` | Guardar en estudio específico |

**Ejemplo de uso:**
\`\`\`bash
# Con curl
curl -X POST http://localhost:3000/dicomweb/studies \\
  -F "files=@imagen.dcm"
\`\`\`

**Con Postman:**
1. Selecciona el request "Guardar Imágenes DICOM"
2. En Body, haz clic en "Select Files" en el campo `files`
3. Selecciona uno o más archivos DICOM (.dcm)
4. Haz clic en "Send"

### 🟣 QIDO-RS (Query - Buscar)

| Método | Endpoint | Parámetros Query | Descripción |
|--------|----------|------------------|-------------|
| GET | `/dicomweb/studies` | PatientName, PatientID, StudyDate, AccessionNumber | Buscar estudios |
| GET | `/dicomweb/studies/{studyUID}/series` | Modality, SeriesNumber | Buscar series |
| GET | `/dicomweb/studies/{studyUID}/series/{seriesUID}/instances` | - | Buscar instancias |

**Ejemplos:**

\`\`\`bash
# Buscar todos los estudios
GET http://localhost:3000/dicomweb/studies

# Buscar por nombre de paciente
GET http://localhost:3000/dicomweb/studies?PatientName=John

# Buscar por Patient ID
GET http://localhost:3000/dicomweb/studies?PatientID=12345

# Buscar por fecha (formato YYYYMMDD)
GET http://localhost:3000/dicomweb/studies?StudyDate=20240101

# Buscar series por modalidad
GET http://localhost:3000/dicomweb/studies/{studyUID}/series?Modality=CT
\`\`\`

### 🟡 WADO-RS (Retrieve - Recuperar)

| Método | Endpoint | Respuesta | Descripción |
|--------|----------|-----------|-------------|
| GET | `/dicomweb/studies/{studyUID}` | JSON | Metadatos del estudio completo |
| GET | `/dicomweb/studies/{studyUID}/series/{seriesUID}` | JSON | Metadatos de la serie |
| GET | `/dicomweb/studies/{studyUID}/series/{seriesUID}/instances/{instanceUID}` | DICOM File | Descargar archivo DICOM |
| GET | `/dicomweb/studies/{studyUID}/series/{seriesUID}/instances/{instanceUID}/metadata` | JSON | Solo metadatos de la instancia |
| GET | `/dicomweb/instances/{instanceUID}/file` | DICOM File | Descarga directa del archivo |

**Ejemplos:**

\`\`\`bash
# Recuperar metadatos de estudio
GET http://localhost:3000/dicomweb/studies/1.2.3.4.5.6

# Descargar archivo DICOM completo
GET http://localhost:3000/dicomweb/studies/{study}/series/{series}/instances/{instance}

# Obtener solo metadatos en JSON
GET http://localhost:3000/dicomweb/studies/{study}/series/{series}/instances/{instance}/metadata
\`\`\`

## 🧪 Guía de Uso con Postman

### 1. Verificar que el Servidor Esté Funcionando

1. En Postman, abre el folder **"0. General"**
2. Ejecuta el request **"Health Check"**
3. Deberías recibir: `{ "status": "OK", "timestamp": "..." }`

### 2. Subir Imágenes DICOM (STOW-RS)

1. Ve al folder **"1. STOW-RS (Store - Guardar)"**
2. Selecciona **"Guardar Imágenes DICOM"**
3. En la pestaña **Body**:
   - Verifica que esté en modo **form-data**
   - En el campo `files`, haz clic en **"Select Files"**
   - Selecciona uno o más archivos DICOM (.dcm) de tu computadora
4. Haz clic en **"Send"**
5. La respuesta incluirá los UIDs que se guardarán automáticamente en variables

**Respuesta esperada:**
\`\`\`json
{
  "status": "success",
  "message": "1 archivos guardados exitosamente, 0 errores",
  "results": [
    {
      "success": true,
      "fileName": "imagen.dcm",
      "sopInstanceUID": "1.2.840...",
      "studyInstanceUID": "1.2.840...",
      "seriesInstanceUID": "1.2.840..."
    }
  ]
}
\`\`\`

### 3. Buscar Estudios (QIDO-RS)

1. Ve al folder **"2. QIDO-RS (Query - Buscar)"**
2. Ejecuta **"Buscar Todos los Estudios"**
3. Verás una lista de todos los estudios guardados
4. Prueba los otros filtros de búsqueda modificando los parámetros

### 4. Recuperar Imágenes (WADO-RS)

1. Ve al folder **"3. WADO-RS (Retrieve - Recuperar)"**
2. Ejecuta **"Recuperar Estudio Completo (Metadatos)"** - verás información del estudio
3. Para descargar un archivo DICOM:
   - Ejecuta **"Descargar Archivo DICOM (Instancia)"**
   - Haz clic en **"Send and Download"** para guardar el archivo

### 5. Ver Estadísticas

1. En el folder **"0. General"**
2. Ejecuta **"Estadísticas"**
3. Verás el total de estudios, series, instancias y espacio usado

## 🔐 Seguridad de los Archivos

### Almacenamiento Seguro

- ✅ **Archivos físicos**: Guardados en carpeta `/uploads` con nombres únicos (UUID)
- ✅ **Base de datos**: Metadatos en SQLite con índices optimizados
- ✅ **Validación**: Se valida que los archivos sean DICOM válidos
- ✅ **UIDs únicos**: Previene duplicación de archivos
- ✅ **Integridad**: Se verifica la existencia de UIDs obligatorios

### Estructura de Base de Datos

**Tabla `studies`**: Información de estudios
- study_instance_uid (PK)
- patient_name, patient_id
- study_date, study_time
- study_description, accession_number

**Tabla `series`**: Información de series
- series_instance_uid (PK)
- study_instance_uid (FK)
- modality, series_number, series_description

**Tabla `instances`**: Información de instancias
- sop_instance_uid (PK)
- series_instance_uid (FK)
- study_instance_uid (FK)
- file_path, file_size
- metadata (JSON completo)

## 📊 Formato DICOMWeb JSON

La API convierte automáticamente archivos DICOM al formato **DICOMWeb JSON Model**:

\`\`\`json
{
  "00100010": {
    "vr": "PN",
    "Value": [{"Alphabetic": "DOE^JOHN"}]
  },
  "0020000D": {
    "vr": "UI",
    "Value": ["1.2.840.113619.2.55.3.2831..."]
  },
  "00080060": {
    "vr": "CS",
    "Value": ["CT"]
  }
}
\`\`\`

Donde:
- **Tag DICOM** (ej: `00100010` = Patient Name)
- **VR** = Value Representation (tipo de dato)
- **Value** = Valor del campo

## 🧰 Utilidades DICOM

El módulo `dicomUtils.js` proporciona:

- `parseDicomFile(filePath)` - Parsear archivo DICOM
- `extractDicomMetadata(filePath)` - Extraer metadatos principales
- `dicomToJson(filePath)` - Convertir DICOM completo a JSON
- `metadataToDicomWebJson(metadata)` - Convertir a formato DICOMWeb

## 🐛 Solución de Problemas

### El servidor no inicia

\`\`\`powershell
# Verifica que Node.js esté instalado
node --version

# Reinstala las dependencias
npm install
\`\`\`

### Error al subir archivos

- Verifica que el archivo sea DICOM válido
- Asegúrate de que el archivo tenga extensión `.dcm`
- Verifica que el archivo contenga los UIDs obligatorios

### No se crean las carpetas

Las carpetas `data/` y `uploads/` se crean automáticamente al iniciar el servidor o al subir el primer archivo.

### Error "ENOENT: no such file"

- El archivo DICOM fue eliminado del sistema
- Verifica la ruta en la base de datos

### Base de datos bloqueada

\`\`\`powershell
# Detén el servidor (Ctrl+C) y reinicia
npm start
\`\`\`

## 📚 Recursos y Referencias

- [DICOMWeb Standard](https://www.dicomstandard.org/dicomweb/)
- [DICOM Parser](https://github.com/cornerstonejs/dicomParser)
- [STOW-RS](https://www.dicomstandard.org/using/dicomweb/store-stow-rs)
- [WADO-RS](https://www.dicomstandard.org/using/dicomweb/retrieve-wado-rs-and-wado-uri)
- [QIDO-RS](https://www.dicomstandard.org/using/dicomweb/query-qido-rs)

## 🛠️ Tecnologías Utilizadas

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **SQLite3** - Base de datos embebida
- **dicom-parser** - Parser de archivos DICOM
- **Multer** - Middleware para upload de archivos
- **UUID** - Generación de identificadores únicos
- **CORS** - Soporte para Cross-Origin Resource Sharing

## 📝 Notas Importantes

1. **Esta es una implementación de desarrollo/demo**. Para producción se recomienda:
   - Autenticación y autorización
   - HTTPS/TLS
   - Rate limiting
   - Validación más robusta
   - Backups automáticos
   - Logging estructurado

2. **Tamaño de archivos**: Por defecto no hay límite de tamaño. Ajusta según necesidades.

3. **Performance**: Para grandes volúmenes, considera usar PostgreSQL o MongoDB en lugar de SQLite.

4. **Almacenamiento**: Los archivos DICOM pueden ocupar mucho espacio. Monitorea el uso de disco.

## 🤝 Soporte

Si encuentras algún problema o necesitas ayuda:

1. Verifica que todas las dependencias estén instaladas
2. Revisa los logs del servidor en la consola
3. Verifica que Postman tenga configurada la variable `baseUrl` correctamente

## 📄 Licencia

ISC

---

**¡Listo para usar!** 🎉

Inicia el servidor con `npm start` e importa la colección de Postman para comenzar a probar la API.
