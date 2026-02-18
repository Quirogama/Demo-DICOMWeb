# 🚀 INICIO RÁPIDO - API DICOMWeb

## ⚡ 3 Pasos para comenzar:

### 1️⃣ Instalar dependencias
\`\`\`powershell
npm install
\`\`\`

### 2️⃣ Iniciar el servidor
\`\`\`powershell
npm start
\`\`\`

### 3️⃣ Importar colección en Postman
1. Abre Postman
2. Clic en "Import"
3. Selecciona el archivo: **DICOMWeb_API.postman_collection.json**

---

## 📋 Prueba Rápida con Postman

### Paso 1: Verifica que funcione
- En Postman, ejecuta: **"0. General" → "Health Check"**
- Debes ver: `{"status": "OK", ...}`

### Paso 2: Sube una imagen DICOM
- Ejecuta: **"1. STOW-RS" → "Guardar Imágenes DICOM"**
- En Body → files → "Select Files"
- Selecciona un archivo .dcm
- Clic en "Send"

### Paso 3: Busca el estudio
- Ejecuta: **"2. QIDO-RS" → "Buscar Todos los Estudios"**
- Verás tu estudio guardado

### Paso 4: Recupera la imagen
- Ejecuta: **"3. WADO-RS" → "Descargar Archivo DICOM"**
- Clic en "Send and Download" para guardar el archivo

---

## 🔗 URLs Importantes

- **API Base**: http://localhost:3001
- **Documentación**: http://localhost:3001/
- **Health Check**: http://localhost:3001/health
- **Estadísticas**: http://localhost:3001/dicomweb/statistics

---

## 📁 ¿Dónde conseguir archivos DICOM de prueba?

### Opción 1: Descargar ejemplos públicos
- [TCIA (The Cancer Imaging Archive)](https://www.cancerimagingarchive.net/)
- [Osirix DICOM Image Library](https://www.osirix-viewer.com/resources/dicom-image-library/)
- [Medical Connections DICOM Samples](https://www.medicalconnections.co.uk/kb/DICOM_Test_Images)

### Opción 2: Archivos de muestra básicos
Busca en Google: "free dicom test images" o "sample dicom files download"

---

## 🎯 Endpoints Principales

| Acción | Método | Endpoint |
|--------|--------|----------|
| Guardar DICOM | POST | /dicomweb/studies |
| Buscar estudios | GET | /dicomweb/studies |
| Descargar archivo | GET | /dicomweb/studies/{study}/series/{series}/instances/{instance} |

---

## ❓ Problemas Comunes

**Error al instalar dependencias**
\`\`\`powershell
# Limpia e instala de nuevo
Remove-Item -Recurse -Force node_modules
npm install
\`\`\`

**Puerto 3000 en uso**
\`\`\`powershell
# Edita server.js y cambia el puerto:
const PORT = process.env.PORT || 3001;
\`\`\`

**No tengo archivos DICOM**
- Descarga ejemplos de los enlaces arriba
- O continúa leyendo el README.md completo para más opciones

---

## 📖 Más información

Lee el archivo **README.md** para documentación completa.

---

¡Listo! 🎉 En menos de 5 minutos puedes estar subiendo y recuperando imágenes DICOM.
