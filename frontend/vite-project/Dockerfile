FROM node:20.20-alpine3.22 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=http://localhost:3001
ARG VITE_ASSETS_URL=http://localhost:3001
ARG VITE_WHATSAPP_NUMBER=
ARG VITE_WHATSAPP_MESSAGE=Hola, necesito ayuda con el Sistema IRIS

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ASSETS_URL=$VITE_ASSETS_URL
ENV VITE_WHATSAPP_NUMBER=$VITE_WHATSAPP_NUMBER
ENV VITE_WHATSAPP_MESSAGE=$VITE_WHATSAPP_MESSAGE

RUN npm run build

FROM nginx:1.28-alpine3.23-slim

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
