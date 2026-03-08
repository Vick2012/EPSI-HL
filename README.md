# EPSI HL - Sistema IRIS

Sistema de gestión interna para EPSI HL. Plataforma web que centraliza remisiones en PDF, gestión de clientes, usuarios con roles y permisos, con autenticación JWT.

---

## Tecnologías

### Backend (API REST)

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Node.js** | LTS | Entorno de ejecución JavaScript |
| **Express** | ^5.2 | Framework HTTP, rutas y middleware |
| **SQLite** | ^5.1 | Base de datos embebida (archivo `iris.db`) |
| **JWT** (jsonwebtoken) | ^9.0 | Tokens de sesión stateless |
| **bcrypt** | ^6.0 | Hash seguro de contraseñas |
| **PDFKit** | ^0.17 | Generación de PDFs de remisiones |
| **Sharp** | ^0.34 | Procesamiento de imágenes/logos para PDF |
| **xlsx** | ^0.18 | Exportación de clientes a Excel |
| **Zod** | ^4.3 | Validación y esquemas de datos |
| **Nodemailer** | ^7.0 | Envío de correos (recuperación de contraseña) |
| **Helmet** | ^8.1 | Cabeceras HTTP de seguridad |
| **express-rate-limit** | ^8.2 | Límite de intentos de login por IP |
| **CORS** | ^2.8 | Control de orígenes permitidos |
| **dotenv** | ^17.2 | Variables de entorno |

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Vite** | ^7.2 | Build tool, dev server, HMR |
| **TypeScript** | ~5.9 | Tipado estático |
| **Vanilla JS** | — | DOM directo, sin framework |
| **CSS** | — | Estilos propios, layout responsive |

---

## Estructura del proyecto

```
EPSI HL/
├── backend/
│   ├── src/
│   │   ├── index.js           # Punto de entrada, Express app
│   │   ├── db.js              # Inicialización SQLite, tablas, admin por defecto
│   │   ├── routes/
│   │   │   ├── auth.js        # Login, JWT, recuperación de contraseña
│   │   │   ├── clientes.js    # CRUD clientes, exportar Excel
│   │   │   ├── remisiones.js  # Crear, consultar, editar, PDF
│   │   │   └── users.js       # CRUD usuarios, roles, reset password
│   │   ├── services/
│   │   │   └── pdfRemision.js # Generación PDF con plantilla EPSI HL
│   │   └── validators/
│   │       ├── remision.js    # Esquemas Zod para remisiones
│   │       └── users.js       # Esquemas Zod para usuarios
│   ├── assets/                # Logos e imágenes para PDF
│   ├── data/                  # iris.db (SQLite)
│   ├── .env                   # Variables de entorno (no versionado)
│   └── package.json
│
├── frontend/
│   └── vite-project/
│       ├── src/
│       │   ├── main.ts        # Aplicación SPA, rutas, wizard remisiones
│       │   ├── style.css      # Estilos globales
│       │   ├── api/
│       │   │   ├── auth.ts    # Login, fetchMe, reset password
│       │   │   ├── base.ts    # API_BASE, ASSETS_BASE, WhatsApp
│       │   │   ├── clientes.ts
│       │   │   ├── remisiones.ts
│       │   │   └── users.ts
│       │   ├── state/
│       │   │   └── session.ts # Token, rol, consecutivo
│       │   └── utils/
│       │       └── format.ts  # formatCurrency, calcularDv
│       ├── public/            # Assets estáticos (logos, iconos)
│       ├── index.html
│       └── package.json
│
└── docs/
    └── paso-a-paso.md         # Guía de configuración
```

---

## Módulos

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| **Remisiones** | ✅ Activo | Crear remisiones, generar PDF, buscar/editar (rol GERENCIAL) |
| **Clientes** | ✅ Activo | CRUD clientes, exportar Excel (rol GERENCIAL) |
| **Usuarios** | ✅ Activo | CRUD usuarios, roles, reset contraseña (GERENCIAL, DIRECCIÓN) |
| **Turnos** | 🔜 Próximamente | Calendario, asignación, notificaciones |
| **Reportes / BI** | 🔜 Próximamente | Métricas y gráficos |

---

## Roles y permisos

| Rol | Crear usuarios | Modificar remisiones | Exportar clientes |
|-----|----------------|----------------------|-------------------|
| **GERENCIAL** | ✅ | ✅ | ✅ |
| **DIRECCIÓN** | ✅ | ❌ | ❌ |
| **SUPERVISIÓN** | ❌ | ❌ | ❌ |
| **ASISTENTE, APOYO, AUXILIARES** | ❌ | ❌ | ❌ |

---

## Inicio rápido

### Requisitos

- Node.js 18+ (LTS recomendado)
- npm

### 1. Instalar dependencias

```bash
cd backend && npm install && cd ..
cd frontend/vite-project && npm install && cd ../..
```

### 2. Configurar entorno

En `backend/` crear `.env`:

```env
PORT=3001
JWT_SECRET=tu-clave-secreta-segura
ADMIN_DEFAULT_PASSWORD=Admin123!
CORS_ORIGINS=http://localhost:5173
```

### 3. Ejecutar

**Terminal 1 – API:**
```bash
cd backend
npm run dev
```

**Terminal 2 – Frontend:**
```bash
cd frontend/vite-project
npm run dev
```

- **API:** http://localhost:3001  
- **Frontend:** http://localhost:5173  

### 4. Acceso por defecto

- **Usuario:** `admin` o `admin@epsihl.com`
- **Contraseña:** `Admin123!` (o `ADMIN_DEFAULT_PASSWORD` en `.env`)

---

## Variables de entorno (Backend)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del API | `3001` |
| `JWT_SECRET` | Clave para firmar tokens | Obligatorio en producción |
| `ADMIN_DEFAULT_PASSWORD` | Contraseña del admin por defecto | `Admin123!` |
| `CORS_ORIGINS` | Orígenes permitidos (comma-separated) | `http://localhost:5173` |
| `TRUST_PROXY` | Activar si hay proxy inverso | `1` |
| `PDF_OUTPUT_DIR` | Carpeta para guardar PDFs | Ruta absoluta |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | Configuración SMTP (recuperación contraseña) | — |
| `LOGIN_RATE_WINDOW_MS` | Ventana para rate limit (ms) | `900000` |
| `LOGIN_RATE_MAX` | Intentos máximos por ventana | `10` |

---

## API – Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/auth/login` | Login (email, password) |
| `GET` | `/auth/me` | Usuario actual (Bearer token) |
| `POST` | `/auth/request-reset` | Solicitar recuperación de contraseña |
| `POST` | `/auth/reset-password` | Restablecer contraseña con token |
| `GET` | `/users` | Listar usuarios (GERENCIAL, DIRECCIÓN) |
| `POST` | `/users` | Crear usuario |
| `PUT` | `/users/:id` | Actualizar usuario |
| `DELETE` | `/users/:id` | Eliminar usuario |
| `POST` | `/users/:id/reset` | Resetear contraseña temporal |
| `GET` | `/clientes/:numero` | Obtener cliente por NIT/CC |
| `POST` | `/clientes` | Crear/actualizar cliente |
| `GET` | `/clientes/exportar` | Exportar clientes a Excel |
| `GET` | `/remisiones/siguiente-numero` | Siguiente consecutivo RM |
| `POST` | `/remisiones` | Crear remisión y generar PDF |
| `GET` | `/remisiones/:numero` | Consultar remisión (GERENCIAL) |
| `GET` | `/remisiones/:numero/pdf` | Descargar PDF (GERENCIAL) |
| `PUT` | `/remisiones/:numero` | Editar remisión (GERENCIAL) |

---

## Documentación adicional

- `docs/paso-a-paso.md` — Guía de configuración y despliegue
