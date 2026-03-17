# EPSI HL - Sistema IRIS

Sistema web interno para EPSI HL. Centraliza remisiones en PDF, gestión de clientes, usuarios con roles y permisos, con autenticación JWT, despliegue con Docker Compose y acceso unificado detrás de `nginx` como reverse proxy.

---

## Tecnologías

### Backend (API REST)

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Node.js** | LTS | Entorno de ejecución JavaScript |
| **Express** | ^5.2 | Framework HTTP, rutas y middleware |
| **PostgreSQL** | 16+ | Base de datos principal en servidor separado |
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

### Infraestructura / despliegue

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Docker Compose** | v2+ | Orquestación local de servicios |
| **Nginx** | 1.28 | Reverse proxy para frontend, API y assets |

---

## Estructura del proyecto

```
EPSI HL/
├── .env.example               # Variables para docker compose
├── docker-compose.yml         # Stack local: postgres + backend + frontend + nginx
├── nginx/
│   └── default.conf           # Reverse proxy a frontend/backend
│
├── backend/
│   ├── src/
│   │   ├── index.js           # Punto de entrada, Express app
│   │   ├── db.js              # Conexión PostgreSQL, migraciones y seed inicial
│   │   ├── routes/
│   │   │   ├── auth.js        # Login, JWT, recuperación de contraseña
│   │   │   ├── clientes.js    # CRUD clientes, exportar Excel
│   │   │   ├── remisiones.js  # Crear, consultar, editar, PDF
│   │   │   └── users.js       # CRUD usuarios, roles, reset password
│   │   ├── services/
│   │   │   └── pdfRemision.js # Generación PDF con plantilla EPSI HL
│   │   ├── utils/
│   │   │   ├── input-guards.js   # Validaciones defensivas de parámetros
│   │   │   └── platform-email.js # Normalización/validación de emails EPSI HL
│   │   └── validators/
│   │       ├── cliente.js     # Esquema Zod para clientes
│   │       ├── remision.js    # Esquemas Zod para remisiones
│   │       └── users.js       # Esquemas Zod para usuarios
│   ├── test/                  # Tests Vitest
│   │   ├── utils/
│   │   └── validators/
│   ├── scripts/
│   │   ├── migrate-postgres.cjs           # Ejecuta migraciones SQL en PostgreSQL
│   │   ├── migrate-sqlite-to-postgres.cjs # Migra datos desde iris.db
│   │   └── generate-lcov.cjs
│   ├── assets/                # Logos e imágenes para PDF
│   ├── data/                  # Respaldo histórico y origen de migración SQLite
│   ├── migrations/            # Esquema versionado PostgreSQL
│   ├── .dockerignore
│   ├── .env                   # Variables de entorno (no versionado)
│   ├── .env.example
│   ├── Dockerfile
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
│       ├── .dockerignore
│       ├── .env.example
│       ├── Dockerfile
│       ├── index.html
│       ├── nginx.conf         # Nginx para servir la SPA
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
- Docker Desktop / Docker Engine + Compose v2 (opcional, recomendado para la stack completa)

### 1. Instalar dependencias

```bash
cd backend && npm install && cd ..
cd frontend/vite-project && npm install && cd ../..
```

### 2. Configurar entorno

#### Desarrollo local

En `backend/` crear `.env` a partir de `backend/.env.example`:

```env
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/epsi_hl
PGSSL=0
JWT_SECRET=tu-clave-secreta-segura
ADMIN_DEFAULT_PASSWORD=Admin123!
CORS_ORIGINS=http://localhost:5173
```

En `frontend/vite-project/` crear `.env` a partir de `frontend/vite-project/.env.example`:

```env
VITE_API_URL=http://localhost:3001
VITE_ASSETS_URL=http://localhost:3001
VITE_WHATSAPP_NUMBER=
VITE_WHATSAPP_MESSAGE=Hola, necesito ayuda con el Sistema IRIS
```

#### Docker Compose

En la raíz del proyecto puedes crear `.env` a partir de `.env.example`.

Ese archivo controla las variables usadas por `docker compose`, por ejemplo:

```env
POSTGRES_DB=epsi_hl
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
PROXY_PORT=8080
JWT_SECRET=tu-clave-secreta-segura
VITE_API_URL=/api
VITE_ASSETS_URL=
VITE_WHATSAPP_NUMBER=
```

Notas:

- En Docker, el frontend consume la API vía `nginx` con `VITE_API_URL=/api`.
- En desarrollo local, el frontend apunta directamente al backend con `http://localhost:3001`.
- El acceso público a la app en Docker es solo a través de `nginx`.

### 3. Preparar base de datos y stack

Con el `docker-compose.yml` local:

```bash
docker compose up -d postgres
cd backend && npm run db:migrate
```

Si prefieres levantar todo con contenedores:

```bash
cp .env.example .env
docker compose up -d --build
```

Esto arranca:

- `postgres` en `http://localhost:5432`
- `nginx` en `http://localhost:8080`
- `frontend` detrás de `nginx` en `/`
- `backend` detrás de `nginx` en `/api`
- assets del backend detrás de `nginx` en `/assets`
- healthcheck del backend detrás de `nginx` en `/health`

Si necesitas trasladar datos existentes desde `backend/data/iris.db`:

```bash
cd backend && npm run db:migrate:sqlite
```

### 4. Ejecutar

#### Opción A: Todo con Docker

**Terminal 1 – Stack completa:**
```bash
cp .env.example .env
docker compose up -d --build
```

- **App:** http://localhost:8080
- **API vía proxy:** http://localhost:8080/api
- **Health vía proxy:** http://localhost:8080/health

#### Opción B: Desarrollo local

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

### 5. Acceso por defecto

- **Usuario:** `admin` o `admin@epsihl.com`
- **Contraseña:** `Admin123!` (o `ADMIN_DEFAULT_PASSWORD` en `.env`)

Importante:

- Cambia `JWT_SECRET` y `ADMIN_DEFAULT_PASSWORD` antes de usar el sistema fuera de desarrollo local.
- No subas archivos `.env` al repositorio.
- `node_modules` y `.env` ya están excluidos por `.gitignore`.

---

## Tests

Se usa **Vitest** en backend y frontend.

### Ejecutar tests

```bash
# Todos los tests (desde la raíz)
npm run test

# Solo backend
cd backend && npm run test

# Solo frontend
cd frontend/vite-project && npm run test
```

### Coverage (para SonarQube)

```bash
# Backend: genera backend/coverage/lcov.info
cd backend && npm run test:coverage

# Frontend: genera frontend/vite-project/coverage/lcov.info
cd frontend/vite-project && npm run test:coverage

# Ambos desde la raíz
npm run test:coverage
```

Antes de ejecutar `sonar-scanner`, ejecutar `npm run test:coverage` para generar los reportes de cobertura.

---

## Variables de entorno (Backend)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del API | `3001` |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `PGSSL` | Activa SSL para PostgreSQL | `0` o `1` |
| `JWT_SECRET` | Clave para firmar tokens | Obligatorio en producción |
| `ADMIN_DEFAULT_PASSWORD` | Contraseña del admin por defecto | `Admin123!` |
| `CORS_ORIGINS` | Orígenes permitidos (comma-separated) | `http://localhost:8080,http://127.0.0.1:8080` |
| `TRUST_PROXY` | Activar si hay proxy inverso | `1` |
| `PDF_OUTPUT_DIR` | Carpeta para guardar PDFs | Ruta absoluta |
| `SQLITE_DB_PATH` | Ruta del SQLite origen para migración | `backend/data/iris.db` |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | Configuración SMTP (recuperación contraseña) | — |
| `LOGIN_RATE_WINDOW_MS` | Ventana para rate limit (ms) | `900000` |
| `LOGIN_RATE_MAX` | Intentos máximos por ventana | `10` |

---

## Variables de entorno (Docker Compose)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `POSTGRES_DB` | Nombre de la base de datos | `epsi_hl` |
| `POSTGRES_USER` | Usuario PostgreSQL | `postgres` |
| `POSTGRES_PASSWORD` | Contraseña PostgreSQL | `postgres` |
| `PROXY_PORT` | Puerto público de `nginx` | `8080` |
| `NODE_ENV` | Entorno del backend | `production` |
| `JWT_SECRET` | Secreto JWT para la API | `cambia-esto` |
| `ADMIN_DEFAULT_PASSWORD` | Clave inicial del admin | `cambia-esto` |
| `CORS_ORIGINS` | Orígenes permitidos por la API | `http://localhost:8080` |
| `VITE_API_URL` | Base API embebida en el build del frontend | `/api` |
| `VITE_ASSETS_URL` | Base para assets del backend | vacío o `/assets` |
| `VITE_WHATSAPP_NUMBER` | Número de soporte WhatsApp | `573001234567` |
| `VITE_WHATSAPP_MESSAGE` | Mensaje por defecto de soporte | `Hola, necesito ayuda...` |

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

Si accedes mediante Docker + `nginx`, estas rutas quedan publicadas bajo `/api`, por ejemplo:

- `POST /api/auth/login`
- `GET /api/health`
- `GET /api/remisiones/siguiente-numero`

---

## Documentación adicional

- `docs/paso-a-paso.md` — Guía de configuración y despliegue
- `docs/postgres-cutover.md` — Checklist de corte y validación para PostgreSQL
