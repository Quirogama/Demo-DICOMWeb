# Guía para Explicar el Proyecto (de lo más básico a lo más complejo)

## 1. ¿Qué problema resuelve esto?

**Problema:** Los hospitales necesitan guardar y compartir imágenes médicas (radiografías, tomografías, resonancias).

**Solución:** Una API que:
- Recibe imágenes DICOM
- Las guarda de forma segura
- Permite buscarlas y descargarlas después

## 2. ¿Qué es DICOM?

**DICOM** = Formato estándar mundial para imágenes médicas (como .jpg pero para hospitales).

Contiene:
- La imagen (rayos X, TAC, etc.)
- Información del paciente (nombre, ID, fecha)
- Información del estudio (modalidad: CT, MR, US)

## 3. Arquitectura del sistema (3 partes)

```
┌─────────────┐
│   Postman   │ ← Herramienta para probar
└──────┬──────┘
       │
       ↓ HTTP
┌─────────────────────┐
│  Servidor Node.js   │ ← Recibe y procesa peticiones
│  (Express)          │
└──────┬──────────────┘
       │
       ↓
┌──────────────┬──────────────┐
│   SQLite     │   uploads/   │ ← Almacenamiento
│  (metadatos) │  (archivos)  │
└──────────────┴──────────────┘
```

## 4. Componentes técnicos (¿Por qué elegí cada uno?)

### Node.js + Express
- **¿Qué es?** Entorno para ejecutar JavaScript en el servidor
- **¿Por qué?** Rápido, fácil de usar, muchas librerías disponibles
- **¿Dónde?** `server.js` (archivo principal)

### SQLite
- **¿Qué es?** Base de datos simple (un archivo .db)
- **¿Por qué?** No necesita instalación, perfecta para demos
- **¿Qué guarda?** Metadatos: nombres de pacientes, fechas, UIDs
- **¿Dónde?** `database.js` (funciones para guardar/buscar)

### dicom-parser
- **¿Qué es?** Librería que lee archivos DICOM
- **¿Por qué?** Extrae la información del archivo (paciente, fecha, etc.)
- **¿Dónde?** `dicomUtils.js` (funciones para leer DICOM)

### Multer
- **¿Qué es?** Middleware para recibir archivos
- **¿Por qué?** Necesario para que Express reciba archivos grandes
- **¿Dónde?** `routes/stow.js` (línea `upload.array('files')`)

## 5. Estándares DICOMWeb (¿Qué son esas siglas raras?)

### STOW-RS (Store Over the Web)
- **Qué hace:** SUBIR imágenes al servidor
- **Método HTTP:** POST
- **Ruta:** `/dicomweb/studies`
- **Archivo:** `routes/stow.js`

### QIDO-RS (Query based on ID for DICOM Objects)
- **Qué hace:** BUSCAR estudios, series, instancias
- **Método HTTP:** GET
- **Ruta:** `/dicomweb/studies` (con filtros opcionales)
- **Archivo:** `routes/qido.js`

### WADO-RS (Web Access to DICOM Objects)
- **Qué hace:** DESCARGAR imágenes o metadatos
- **Método HTTP:** GET
- **Ruta:** `/dicomweb/studies/{studyUID}/series/{seriesUID}/instances/{instanceUID}`
- **Archivo:** `routes/wado.js`

## 6. Flujo completo (paso a paso)

### Paso 1: Usuario sube imagen (STOW-RS)
1. Postman envía archivo .dcm → `POST /dicomweb/studies`
2. `routes/stow.js` recibe el archivo
3. `dicomUtils.js` lee los metadatos (paciente, fecha, UIDs)
4. `database.js` guarda metadatos en SQLite
5. El archivo se guarda en `uploads/` con nombre único (UUID)

### Paso 2: Usuario busca estudios (QIDO-RS)
1. Postman pide lista → `GET /dicomweb/studies`
2. `routes/qido.js` consulta la base de datos
3. `database.js` devuelve todos los estudios
4. Se retorna JSON con la información

### Paso 3: Usuario descarga imagen (WADO-RS)
1. Postman pide archivo → `GET /dicomweb/studies/{...}/instances/{...}`
2. `routes/wado.js` busca en la base de datos
3. `database.js` retorna la ruta del archivo
4. Se envía el archivo .dcm de vuelta al usuario

## 7. Decisiones técnicas importantes

### Puerto 3001
- **Por qué:** El 3000 estaba ocupado (error EADDRINUSE)
- **Alternativa:** Cualquier puerto libre (3002, 8080, etc.)

### Base de datos: 3 tablas
```
studies (estudios)
  ├── series (series)
  │     └── instances (instancias/imágenes)
```
- **Por qué:** Refleja la jerarquía DICOM real
- **Ventaja:** Puedes buscar "todas las imágenes de un paciente"

### Nombres de archivo con UUID
- **Por qué:** Evita que dos archivos con el mismo nombre se sobrescriban
- **Ejemplo:** `abc123-def456-ghi789.dcm`

### UIDs (Unique Identifiers)
- **Qué son:** Códigos únicos para cada estudio/serie/instancia
- **Formato:** `1.2.840.113619.2.55.3.2831473180...`
- **Por qué:** Estándar DICOM mundial para identificar sin ambigüedad

## 8. ¿Qué hace cada archivo del código?

### Archivos principales
- `server.js` → Inicia el servidor, configura rutas
- `database.js` → Funciones para guardar/buscar en SQLite
- `dicomUtils.js` → Lee archivos DICOM y extrae información
- `package.json` → Lista de dependencias (librerías necesarias)

### Carpeta routes/
- `stow.js` → Recibe y guarda archivos DICOM
- `qido.js` → Busca estudios/series/instancias
- `wado.js` → Descarga archivos y metadatos

### Carpetas que se crean automáticamente
- `data/` → Contiene `dicomweb.db` (base de datos)
- `uploads/` → Archivos DICOM guardados
- `node_modules/` → Librerías instaladas (no se sube a GitHub)

## 9. ¿Por qué usar Postman?

**Postman** es como un navegador pero para APIs:
- Navegador normal → Solo puede hacer GET (ver páginas web)
- Postman → Puede hacer POST (enviar archivos), GET, PUT, DELETE

**Alternativas:** curl, Thunder Client, Insomnia

## 10. Demostración en clase (orden sugerido)

### Preparación (2-3 min)
1. Mostrar estructura de carpetas
2. Explicar `npm install` (instala dependencias)
3. Ejecutar `npm start` (inicia servidor)

### Demo en vivo (5-7 min)
1. **Health Check** → Servidor funciona
2. **STOW-RS** → Subir un .dcm (Select Files en Postman)
3. **QIDO-RS** → Buscar lo que se subió
4. **WADO-RS** → Descargar (Send and Download)

### Código (mostrar brevemente)
1. `server.js` línea 84 → `app.listen(PORT, ...)`
2. `routes/stow.js` línea 40 → `extractDicomMetadata(file.path)`
3. `database.js` línea 15-25 → Estructura de tablas

### Preguntas frecuentes
- **¿Por qué SQLite y no MySQL?** → Demo, no necesita instalación
- **¿Por qué Node.js y no Python?** → Familiaridad, librerías disponibles
- **¿Es seguro?** → No, falta autenticación (solo es demo)
- **¿Funciona en producción?** → Faltaría HTTPS, autenticación, validación

## 11. Posibles mejoras (para preguntas)

**Si me preguntan qué falta:**
- Autenticación (usuarios y contraseñas)
- HTTPS (conexión segura)
- Visor de imágenes DICOM en navegador
- Base de datos más robusta (PostgreSQL)
- Caché para búsquedas rápidas
- Logs estructurados
- Tests automatizados

---

## Resumen ultra corto (30 segundos)

"Creé una API REST que guarda y recupera imágenes médicas DICOM. Usa Node.js como servidor, SQLite para metadatos, y sigue los estándares DICOMWeb (STOW, QIDO, WADO). Se prueba con Postman: subes un archivo, lo buscas, y lo descargas."
