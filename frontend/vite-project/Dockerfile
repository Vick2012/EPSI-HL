# ----- ETAPA 1: CONSTRUCTOR (BUILDER) -----
# 1. Utiliza Node.js (versión 20 ligera alpine) como imagen base y nombra esta fase "builder".
#    Esta etapa sólo servirá para compilar el proyecto y no irá a Producción para reducir el tamaño.
FROM node:20.20-alpine3.22 AS builder

# 2. Crea y establece /app como el directorio de trabajo donde procesaremos los archivos.
WORKDIR /app

# 3. Copia el archivo package.json (y pnpm-lock si existe) desde la carpeta del frontend al contenedor.
COPY package*.json pnpm-lock.yaml* ./

# 4. Habilita instalación global instalando pnpm a través de npm nativo de esta imagen Node
RUN npm install -g pnpm

# 5. Instala todas las dependencias (incluyendo las de desarrollo) con pnpm, necesarias para construir con Vite.
RUN pnpm install

# 6. Copia todo el código fuente del frontend al contenedor.
COPY . .

# 7. Declara argumentos de construcción (ARG). Estos deben inyectarse al construir el contenedor 
#    usando banderas `--build-arg`. Tienen valores por defecto locales para que no rompa si olvidas inyectarlos.
ARG VITE_API_URL=http://localhost:3001
ARG VITE_ASSETS_URL=http://localhost:3001
ARG VITE_WHATSAPP_NUMBER=
ARG VITE_WHATSAPP_MESSAGE=Hola, necesito ayuda con el Sistema IRIS

# 8. Mapea y "fija" los valores ARG hacia variables de entorno (ENV) estáticas
#    para que Vite (que lee variables VITE_...) las detecte en el momento de compilar.
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ASSETS_URL=$VITE_ASSETS_URL
ENV VITE_WHATSAPP_NUMBER=$VITE_WHATSAPP_NUMBER
ENV VITE_WHATSAPP_MESSAGE=$VITE_WHATSAPP_MESSAGE

# 9. Construye los activos optimizados de producción.
#    Vite transformará los archivos React/Vue/Svelte y quemará las variables ENV en "dist/".
RUN pnpm run build


# ----- ETAPA 2: SERVIDOR FINAL (RUNNER) -----
# 10. Inicia una imagen base completamente nueva, ligera y limpia (olvidando las dependencias de arriba).
FROM node:20.20-alpine3.22

# 11. Establece su directorio de trabajo.
WORKDIR /app

# 12. Instala la herramienta de servicio estático 'serve' globalmente para manejar la carpeta dist.
#     Si quieres usar pnpm global aquí, lo instalas antes o simplemente usas npm ya que es instalación global nativa.
RUN npm install -g serve

# 13. Traslada ÚNICAMENTE la carpeta de resultado ("dlst") compilada en la Etapa 1
#     hacia la nueva imagen final, desechando el código fuente y las pesadas dependencias de node_modules.
COPY --from=builder /app/dist ./dist

# 14. Variable predeterminada del puerto que necesita Cloud Run.
ENV PORT=8080

# 15. Aviso para que Docker asigne reglas internas al puerto dinámico.
EXPOSE 8080

# 16. Comando principal de arranque que sirve los archivos por HTTP inyectando dinámicamente el PORT de Cloud Run.
CMD ["sh", "-c", "serve -s dist -l ${PORT}"]
