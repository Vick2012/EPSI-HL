EPSI HL - Sistema IRIS

Esta carpeta contiene el proyecto Sistema IRIS con los módulos solicitados:

- Remisiones en PDF con formato institucional y trazabilidad por usuario.
- Gestión de turnos con calendario y notificaciones WhatsApp.
- Gestión de usuarios y roles con JWT (login requerido para remisiones).
- BI con métricas y gráficas.

Tecnologías utilizadas

* Backend (API)

| Tecnología | Propósito |
|------------|-----------|
| **Node.js** | Entorno de ejecución JavaScript en el servidor. |
| **Express** | Framework HTTP para rutas (auth, remisiones, clientes, usuarios) y middleware. |
| **SQLite** | Base de datos embebida en archivo; sin servidor externo, adecuada para equipos pequeños y despliegue sencillo. |
| **JWT (jsonwebtoken)** | Tokens de sesión sin estado en servidor. |
| **bcrypt** | Hash seguro de contraseñas antes de guardarlas. |
| **PDFKit** | Generación de PDFs de remisiones con layout, tablas y cálculos. |
| **Sharp** | Procesamiento de logos/imágenes (redimensionar, convertir) para incluirlos en el PDF. |
| **Nodemailer** | Envío de correos (recuperación de contraseña, etc.). |
| **xlsx** | Exportación de la base de clientes a Excel (.xlsx). |
| **Zod** | Validación de datos de entrada y tipado en la API. |
| **dotenv** | Cargar secrets y configuración desde variables de entorno. |
| **CORS** | Controlar qué dominios pueden consumir la API desde el navegador. |
| **Helmet** | Cabeceras HTTP de seguridad (protección XSS, clickjacking, etc.). |
| **express-rate-limit** | Límite de intentos de login por IP para mitigar fuerza bruta. |

Frontend (interfaz)

| Tecnología | Propósito |
|------------|-----------|
| **Vite** | Build tool y dev server con HMR; builds optimizados para producción. |
| **TypeScript** | Tipado estático para menos errores y mejor mantenibilidad. |
| **Vanilla JS (DOM)** | Sin framework; manipulación directa del DOM. Proyecto liviano y controlable. |
| **CSS** | Estilos propios para layout, wizard, cards, responsividad y tema corporativo. |

Estructura del proyecto

- `backend/` — API REST (Node.js + Express).
- `frontend/vite-project/` — UI web (Vite + TypeScript).
- `docs/` — Guía paso a paso.

Estado actual

- UI renovada con sidebar y hero.
- Remisiones requieren login para generar PDF.
- Consecutivo automático RM 001, RM 002, ...
- IVA 19% calculado sobre el total ingresado.
- PDF con fecha/hora en pie de página y usuario autenticado.

## Primer paso

Sigue la guía en `docs/paso-a-paso.md`.
