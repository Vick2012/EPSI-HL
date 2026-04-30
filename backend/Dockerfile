FROM node:20-bookworm-slim

WORKDIR /app

ENV PORT=8080
ENV HOST=0.0.0.0
ENV NODE_ENV=production
ENV PDF_OUTPUT_DIR=/tmp/remisiones-pdf

# Copia solo package-lock.json (npm)
COPY package*.json ./

# Instala dependencias con npm
RUN npm install --omit=dev

COPY . .

EXPOSE 8080

CMD ["node", "src/index.js"]