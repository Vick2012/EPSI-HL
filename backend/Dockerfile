# ----- INICIO DE CONFIGURACIÓN DEL SERVIDOR BACKEND -----

# 1. Utiliza la imagen oficial de Node.js versión 20 basada en la distribución ligera bookworm-slim.
FROM node:20-bookworm-slim

# 2. Establece el directorio de trabajo predeterminado ('/app') dentro del contenedor donde se ejecutarán los siguientes comandos.
WORKDIR /app

# 3. Define variables de entorno fundamentales para Cloud Run:
# - Aseguramos port 8080 como puerto principal donde Cloud Run recibirá el tráfico por defecto.
ENV PORT=8080
# - Le indicamos a Node que acepte conexiones desde cualquier IP (necesario para que Cloud Run enrute el tráfico hacia el contenedor).
ENV HOST=0.0.0.0
# - NODE_ENV en 'production' hace que Express.js y otros módulos se optimicen para mayor rendimiento.
ENV NODE_ENV=production
# - Ajustamos la ruta para generación de PDFs a /tmp/ ya que Cloud Run sólo permite escritura en memoria temporal.
ENV PDF_OUTPUT_DIR=/tmp/remisiones-pdf

# 4. Copia los archivos de gestión de paquetes primero para aprovechar el caché de capas de Docker.
COPY package*.json pnpm-lock.yaml* ./

# 5. Instala "pnpm" globalmente usando npm (ya que node trae npm por defecto).
RUN npm install -g pnpm

# 6. Instala las dependencias del proyecto ignorando las dependencias que solo son de desarrollo (--prod).
RUN pnpm install --prod

# 7. Copia todo el resto del código fuente desde tu máquina hacia el contenedor.
COPY . .

# 8. Declara que el contenedor escuchará peticiones en el puerto 8080.
EXPOSE 8080

# 9. Comando final de ejecución de Cloud Run: 
# Usa 'sh -c' para permitir evaluar 2 comandos unidos por &&.
# Corre las migraciones de base de datos e inmediatamente inicializa tu servidor web usando pnpm.
CMD ["node", "src/index.js"]
