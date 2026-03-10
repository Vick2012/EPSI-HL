# DOCUMENTO DE ENTREGA
## EPSI HL - Sistema IRIS

---

**Versión:** 1.0  
**Fecha de entrega:** Marzo 2026  
**Tipo de documento:** Entrega de proyecto de software  

---

## 1. IDENTIFICACIÓN DEL PROYECTO

| Campo | Descripción |
|------|-------------|
| **Nombre del proyecto** | EPSI HL - Sistema IRIS |
| **Cliente / Beneficiario** | EPSI HL |
| **Descripción** | Sistema de gestión interna para centralizar remisiones en PDF, gestión de clientes, usuarios con roles y permisos. |
| **Alcance** | Plataforma web con autenticación JWT, módulos de Remisiones, Clientes y Usuarios. |

---

## 2. OBJETO DE LA ENTREGA

Se entrega el **Sistema IRIS** (Sistema de gestión, de consulta e información), una aplicación web funcional que permite:

- Generar remisiones en formato PDF con plantilla institucional EPSI HL
- Gestionar base de datos de clientes con validación de NIT/DV
- Administrar usuarios con roles y permisos diferenciados
- Autenticación segura mediante JWT
- Recuperación de contraseña por correo electrónico
- Exportación de clientes a Excel

---

## 3. MÓDULOS ENTREGADOS

### 3.1 Módulo de Remisiones ✅

| Funcionalidad | Estado | Descripción |
|---------------|--------|-------------|
| Crear remisión | ✅ | Wizard en 3 pasos: Cliente, Items, Resumen |
| Generar PDF | ✅ | Plantilla EPSI HL con logo, tabla de items, IVA 19% |
| Consecutivo automático | ✅ | Formato RM 001, RM 002, ... |
| Buscar remisión | ✅ | Solo rol GERENCIAL |
| Editar remisión | ✅ | Solo rol GERENCIAL |
| Anular remisión | ✅ | Solo rol GERENCIAL |
| Descargar PDF existente | ✅ | Solo rol GERENCIAL |

### 3.2 Módulo de Clientes ✅

| Funcionalidad | Estado | Descripción |
|---------------|--------|-------------|
| Consultar por NIT/CC | ✅ | Carga automática al ingresar identificación |
| Crear cliente nuevo | ✅ | Validación de campos obligatorios (incl. email) |
| Actualizar cliente | ✅ | Upsert por número de documento |
| Exportar a Excel | ✅ | Solo rol GERENCIAL |
| Cálculo automático DV | ✅ | Para NIT colombiano |

### 3.3 Módulo de Usuarios ✅

| Funcionalidad | Estado | Descripción |
|---------------|--------|-------------|
| Login | ✅ | Email/usuario y contraseña |
| Cerrar sesión | ✅ | Redirección inmediata a login |
| Crear usuario | ✅ | Solo GERENCIAL y DIRECCIÓN |
| Editar usuario | ✅ | Solo GERENCIAL y DIRECCIÓN |
| Eliminar usuario | ✅ | Solo GERENCIAL y DIRECCIÓN |
| Resetear contraseña | ✅ | Genera contraseña temporal |
| Roles disponibles | ✅ | GERENCIAL, DIRECCIÓN, SUPERVISIÓN, ASISTENTE, APOYO, AUXILIARES |

### 3.4 Módulos en desarrollo 🔜

| Módulo | Estado | Observaciones |
|--------|--------|---------------|
| Turnos | Próximamente | Calendario, asignación, notificaciones |
| Reportes / BI | Próximamente | Métricas y gráficos |

---

## 4. ROLES Y PERMISOS

| Rol | Crear usuarios | Modificar remisiones | Exportar clientes | Acceso usuarios |
|-----|----------------|---------------------|-------------------|-----------------|
| **GERENCIAL** | ✅ | ✅ | ✅ | ✅ |
| **DIRECCIÓN** | ✅ | ❌ | ❌ | ✅ |
| **SUPERVISIÓN** | ❌ | ❌ | ❌ | ❌ |
| **ASISTENTE** | ❌ | ❌ | ❌ | ❌ |
| **APOYO** | ❌ | ❌ | ❌ | ❌ |
| **AUXILIARES** | ❌ | ❌ | ❌ | ❌ |

---

## 5. ESPECIFICACIONES TÉCNICAS

### 5.1 Stack tecnológico

**Backend:**
- Node.js + Express 5
- SQLite (base de datos embebida)
- JWT (jsonwebtoken)
- bcrypt, PDFKit, Sharp, xlsx, Zod, Nodemailer
- Helmet, CORS, express-rate-limit

**Frontend:**
- Vite 7 + TypeScript 5
- Vanilla JavaScript (sin framework)
- CSS personalizado

### 5.2 Estructura de archivos entregados

```
EPSI HL/
├── backend/           # API REST
├── frontend/          # Interfaz web (vite-project)
├── docs/              # Documentación
│   ├── documento-entrega.md
│   └── paso-a-paso.md
└── README.md
```

---

## 6. INSTRUCCIONES DE INSTALACIÓN

### 6.1 Requisitos previos

- Node.js 18 o superior (LTS recomendado)
- npm

### 6.2 Pasos de instalación

1. **Instalar dependencias:**
   ```bash
   cd backend && npm install && cd ..
   cd frontend/vite-project && npm install && cd ../..
   ```

2. **Configurar variables de entorno** en `backend/.env`:
   ```env
   PORT=3001
   JWT_SECRET=clave-secreta-segura
   ADMIN_DEFAULT_PASSWORD=Admin123!
   CORS_ORIGINS=http://localhost:5173
   ```

3. **Ejecutar Backend:**
   ```bash
   cd backend
   npm run dev
   ```

4. **Ejecutar Frontend** (en otra terminal):
   ```bash
   cd frontend/vite-project
   npm run dev
   ```

5. **Acceder:** http://localhost:5173

---

## 7. CREDENCIALES DE ACCESO

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | Admin123! | GERENCIAL |
| `admin@epsihl.com` | Admin123! | GERENCIAL |
| `admin@epsihl.com.co` | Admin123! | GERENCIAL |

> **Nota:** La contraseña por defecto puede modificarse en la variable `ADMIN_DEFAULT_PASSWORD` del archivo `.env` antes del primer arranque.

---

## 8. CONTENIDO DE LA ENTREGA

- [x] Código fuente del backend (Node.js/Express)
- [x] Código fuente del frontend (Vite/TypeScript)
- [x] Base de datos SQLite (se crea automáticamente)
- [x] Plantilla PDF de remisiones
- [x] Documentación técnica (README.md)
- [x] Guía de configuración (docs/paso-a-paso.md)
- [x] Documento de entrega (este documento)

---

## 9. LIMITACIONES Y OBSERVACIONES

1. **Módulos pendientes:** Turnos y BI están previstos para fases posteriores.
2. **Producción:** Configurar `JWT_SECRET` seguro y `CORS_ORIGINS` según dominio de producción.
3. **SMTP:** Para recuperación de contraseña por email, configurar variables SMTP en `.env`.
4. **Base de datos:** SQLite es adecuada para equipos pequeños; para mayor escalabilidad podría migrarse a PostgreSQL/MySQL.

---

## 10. ACEPTACIÓN

| Concepto | Firma | Fecha |
|----------|-------|-------|
| **Entrega realizada por** | _________________________ | ______/______/______ |
| **Recibido por** | _________________________ | ______/______/______ |

---

## ANEXOS

- **Anexo A:** README.md — Documentación técnica completa
- **Anexo B:** docs/paso-a-paso.md — Guía de configuración paso a paso

---

*Documento generado para la entrega formal del proyecto EPSI HL - Sistema IRIS.*
