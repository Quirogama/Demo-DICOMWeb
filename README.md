# 🏥 API DICOMWeb - Sistema de Gestión de Imágenes Médicas

![DICOM](https://img.shields.io/badge/DICOM-Medical%20Imaging-blue)
![Node.js](https://img.shields.io/badge/Node.js-v14+-green)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey)

Sistema completo para **enviar, almacenar y recuperar** imágenes médicas en formato **DICOMWeb**. Implementa los estándares STOW-RS, WADO-RS y QIDO-RS con seguridad de archivos y base de datos SQLite.

# API DICOMWeb - Demo

Demo corta para mostrar el flujo de enviar y recuperar imagenes DICOM con Postman.

## Flujo de la demo (linea de tiempo)

1) Iniciar servidor
```powershell
npm install
npm start
```

2) Verificar que el servidor responde
- GET http://localhost:3001/
- GET http://localhost:3001/health

3) Subir una imagen DICOM (STOW-RS)
- Postman > 1. STOW-RS (Store - Guardar)
- Request: Guardar Imagenes DICOM
- Body > form-data > files > Select Files
- Send

4) Buscar lo que subiste (QIDO-RS)
- Postman > 2. QIDO-RS (Query - Buscar)
- Request: Buscar Todos los Estudios

5) Recuperar el archivo (WADO-RS)
- Postman > 3. WADO-RS (Retrieve - Recuperar)
- Request: Descargar Archivo DICOM (Instancia)
- Usar Send and Download

## Que pasa por dentro (muy corto)

- El archivo se guarda en la carpeta uploads/
- Los metadatos se guardan en la base de datos SQLite
- Para recuperar, se usa el UID de estudio, serie e instancia

## Archivos clave para mostrar en clase

- server.js (arranque del servidor)
- routes/stow.js (subida)
- routes/qido.js (busqueda)
- routes/wado.js (descarga)

## Notas

- Si el puerto 3001 esta ocupado, cierra el proceso que lo usa.
- En Postman, la descarga no se muestra: se guarda como archivo .dcm.


**¡Listo para usar!** 🎉

Inicia el servidor con `npm start` e importa la colección de Postman para comenzar a probar la API.
