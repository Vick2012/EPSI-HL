# Despliegue en Google Cloud Run (Contenedores Independientes)

Este proyecto ha sido optimizado para ser desplegado en **Google Cloud Run** sin la necesidad de `docker-compose.yml`, ya que Cloud Run despliega cada servicio como un contenedor independiente.

A continuación, se encuentran los comandos necesarios para construir, probar localmente y desplegar ambos contenedores (Frontend y Backend).

---

## 1. Backend

El backend ahora está configurado de forma predeterminada para escuchar en el puerto `8080`, usar `/tmp/remisiones-pdf` para los reportes y estar listo para Cloud Run.

### Construcción Local
Crea la imagen de Docker localmente:
```cmd
docker build -t epsi-backend ./backend
```

### Ejecución Local de Prueba
Cuando se ejecuta, es posible que desees anular ciertas variables de entorno que Cloud Run inyectará más tarde (como la URL de la base de datos).
```cmd
docker run -p 8080:8080 -e DATABASE_URL="postgres://usuario:password@localhost:5432/epsi" epsi-backend
```

### Comandos de Despliegue en Cloud Run
Si usas Google Cloud SDK (`gcloud`):
```cmd
# 1. Enviar el código a Cloud Build y desplegar en Cloud Run directamente
gcloud run deploy epsi-backend \
  --source ./backend \
  --port 8080 \
  --allow-unauthenticated \
  --set-env-vars="DATABASE_URL=tu_url_de_db_real" \
  --region=us-central1
```
*(Nota: Sustituye variables como DATABASE_URL, o utiliza Cloud Secret Manager para inyectar estos valores).*

---

## 2. Frontend

El frontend está configurado para pasar los argumentos al momento de construcción y servir un paquete estático optimizado, exponiendo dinámicamente el `PORT` dictado por Cloud Run.

### Construcción Local
Al compilar, inyéctale las variables necesarias para el Vite:
```cmd
docker build \
  --build-arg VITE_API_URL=https://tu-api-backend-url.run.app \
  --build-arg VITE_ASSETS_URL=https://tu-api-backend-url.run.app \
  -t epsi-frontend ./frontend/vite-project
```

### Ejecución Local de Prueba
```cmd
docker run -p 8081:8080 epsi-frontend
```

### Comandos de Despliegue en Cloud Run
```cmd
gcloud run deploy epsi-frontend \
  --source ./frontend/vite-project \
  --port 8080 \
  --allow-unauthenticated \
  --region=us-central1 \
  --set-build-env-vars="VITE_API_URL=https://tu-api-backend-url.run.app,VITE_ASSETS_URL=https://tu-api-backend-url.run.app"
```

---

## Notas de Arquitectura
- **Volúmenes y Almacenamiento**: Cloud Run posee un sistema de archivos temporal por defecto. Hemos mapeado internamente la creación de los PDFs hacia `/tmp/remisiones-pdf` ya que en Google Cloud Run es la única carpeta que tiene garantía de permitir escrituras temporales y en memoria RAM. Es importante tener esto en cuenta si los archivos grandes crecen (podrían agotar la RAM de la instancia). Si necesitas persistencia real para descargas a largo plazo, deberás considerar enviar esos archivos a un bucket de Google Cloud Storage.
- **Base de Datos**: Ninguno de estos contenedores incorpora un motor de bases de datos internamente para Producción (por diseño y mejores prácticas Cloud). Debes configurar y conectar el Backend a una instancia dedicada como Google Cloud SQL o una Base de Datos administrada externa para PostgreSQL.
