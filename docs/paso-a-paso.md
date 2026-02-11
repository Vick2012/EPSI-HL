# Guía paso a paso

Este documento te guía para crear la aplicación desde cero.

## Paso 1: Preparar el entorno

1. Instala Node.js LTS.
2. Instala Git si no lo tienes.
3. Abre una terminal en esta carpeta.

## Paso 2: Crear el backend (hecho)

1. Carpeta `backend/` creada.
2. Proyecto Node inicializado.
3. Dependencias instaladas:
   - `express cors jsonwebtoken bcrypt zod nodemailer pdfkit`
4. Siguiente: crear `src/index.js` y la estructura del API.

## Paso 3: Crear el frontend (hecho)

1. Carpeta `frontend/` creada.
2. Proyecto Vite creado en `frontend/vite-project/`.
3. Siguiente: instalar dependencias y preparar estructura.

## Paso 4: Definir módulos (en progreso)

### Módulo 1: Remisiones

- Formulario con campos de cliente, items, método de pago, observaciones y fecha.
- Generación de PDF con plantilla.
- Envío de email automático.
- Historial y filtros.

### Módulo 2: Turnos

- Calendario con vista semanal/mensual.
- Asignación por empleado.
- Notificación WhatsApp.
- Historial de turnos.

### Módulo 3: Usuarios y roles

- JWT, roles y permisos.
- CRUD de usuarios.
- Perfil y cambio de contraseña.

### Módulo 4: BI

- Estadísticas y gráficos dinámicos.

---

## Paso 5: Levantar el proyecto local (nuevo)

1. API:
   - En `backend/` ejecuta: `npm run dev`
   - Verifica: `http://localhost:3001/health`
2. Frontend:
   - En `frontend/vite-project/` ejecuta: `npm run dev`
   - Abre: `http://localhost:5173`

---

Siguiente: crear el esqueleto real de los módulos (API + UI) en el Paso 6.

## Paso 6: Generar PDF de remisión (nuevo)

1. Copia el logo EPSI HL en `backend/assets/` con el nombre:
   - `epsi-hl-logo.png`
2. Inicia la API:
   - `npm run dev` en `backend/`
3. Prueba la generación del PDF con Postman/Insomnia:
   - URL: `POST http://localhost:3001/remisiones`
   - Body JSON de ejemplo:
     ```json
     {
       "numero": "7496",
       "fecha": "2026-02-03",
       "metodoPago": "efectivo",
       "observaciones": "Sin observaciones",
       "cliente": {
         "nombre": "Alexander Gonzales",
         "nit": "123456789",
         "direccion": "Cota",
         "ciudad": "Cota",
         "telefono": "3100000000"
       },
       "items": [
         { "descripcion": "Descargue sencillo de ladrillo parcial", "cantidad": 1, "valorUnitario": 100000, "subtotal": 100000 },
         { "descripcion": "Placa WMQ 932", "cantidad": 1, "valorUnitario": 0, "subtotal": 0 }
       ],
       "subtotal": 100000,
       "ivaPorcentaje": 0,
       "iva": 0,
       "total": 100000
     }
     ```
4. El API responderá un PDF con la plantilla similar a la imagen.
