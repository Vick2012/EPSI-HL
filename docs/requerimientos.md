# Requerimientos del Sistema
## EPSI HL - Sistema IRIS

---

## 1. REQUERIMIENTOS FUNCIONALES

Los requerimientos funcionales definen **qué** debe hacer el sistema. Se organizan por módulo.

### 1.1 Autenticación y sesión

| ID | Requerimiento | Prioridad | Estado |
|----|---------------|-----------|--------|
| RF-01 | El sistema debe permitir el inicio de sesión con usuario/email y contraseña | Alta | ✅ |
| RF-02 | El sistema debe validar credenciales contra la base de datos antes de conceder acceso | Alta | ✅ |
| RF-03 | El sistema debe emitir un token JWT válido por 8 horas tras login exitoso | Alta | ✅ |
| RF-04 | El sistema debe permitir cerrar sesión y redirigir inmediatamente a la página de login | Alta | ✅ |
| RF-05 | El sistema debe permitir solicitar recuperación de contraseña por correo electrónico | Media | ✅ |
| RF-06 | El sistema debe permitir restablecer contraseña mediante token temporal | Media | ✅ |
| RF-07 | El sistema debe limitar intentos de login por IP para mitigar fuerza bruta | Media | ✅ |

### 1.2 Gestión de usuarios

| ID | Requerimiento | Prioridad | Estado |
|----|---------------|-----------|--------|
| RF-08 | El sistema debe permitir crear usuarios con email, contraseña, nombre y rol | Alta | ✅ |
| RF-09 | El sistema debe permitir editar usuarios existentes (email, nombre, rol, contraseña) | Alta | ✅ |
| RF-10 | El sistema debe permitir eliminar usuarios | Alta | ✅ |
| RF-11 | El sistema debe permitir resetear la contraseña de un usuario y generar una temporal | Media | ✅ |
| RF-12 | El sistema debe soportar los roles: GERENCIAL, DIRECCIÓN, SUPERVISIÓN, ASISTENTE, APOYO, AUXILIARES | Alta | ✅ |
| RF-13 | Solo los roles GERENCIAL y DIRECCIÓN deben poder acceder al módulo de usuarios | Alta | ✅ |

### 1.3 Gestión de clientes

| ID | Requerimiento | Prioridad | Estado |
|----|---------------|-----------|--------|
| RF-14 | El sistema debe permitir consultar un cliente por número de identificación (NIT/CC) | Alta | ✅ |
| RF-15 | El sistema debe cargar automáticamente los datos del cliente al ingresar su identificación | Alta | ✅ |
| RF-16 | El sistema debe permitir crear un cliente nuevo con todos los campos obligatorios | Alta | ✅ |
| RF-17 | El sistema debe validar que todos los campos (NIT, nombre, dirección, ciudad, teléfono, email) estén completos al guardar cliente nuevo | Alta | ✅ |
| RF-18 | El sistema debe mostrar un aviso visible cuando falten campos al guardar cliente nuevo | Alta | ✅ |
| RF-19 | El sistema debe calcular automáticamente el dígito de verificación (DV) para NIT colombiano | Media | ✅ |
| RF-20 | El sistema debe permitir exportar la base de clientes a Excel (.xlsx) | Media | ✅ |
| RF-21 | Solo el rol GERENCIAL debe poder exportar clientes | Alta | ✅ |

### 1.4 Remisiones

| ID | Requerimiento | Prioridad | Estado |
|----|---------------|-----------|--------|
| RF-22 | El sistema debe permitir crear remisiones mediante un wizard en 3 pasos (Cliente, Items, Resumen) | Alta | ✅ |
| RF-23 | El sistema debe asignar consecutivo automático a las remisiones (RM 001, RM 002, ...) | Alta | ✅ |
| RF-24 | El sistema debe generar PDF de la remisión con plantilla institucional EPSI HL | Alta | ✅ |
| RF-25 | El PDF debe incluir: logo, datos del cliente, tabla de items, subtotal, IVA 19%, total | Alta | ✅ |
| RF-26 | El sistema debe permitir buscar una remisión existente por número | Alta | ✅ |
| RF-27 | El sistema debe permitir editar una remisión existente | Alta | ✅ |
| RF-28 | El sistema debe permitir anular una remisión | Alta | ✅ |
| RF-29 | El sistema debe permitir descargar el PDF de una remisión existente | Alta | ✅ |
| RF-30 | Solo el rol GERENCIAL debe poder buscar, editar, anular y descargar PDF de remisiones | Alta | ✅ |
| RF-31 | El sistema debe soportar métodos de pago: efectivo, Nequi, transferencia Bancolombia | Media | ✅ |

### 1.5 Navegación e interfaz

| ID | Requerimiento | Prioridad | Estado |
|----|---------------|-----------|--------|
| RF-32 | El sistema debe mostrar un menú lateral con secciones: Inicio, Remisiones, Turno, Reportes, BI, Usuarios y contraseñas | Alta | ✅ |
| RF-33 | La sección Inicio debe mostrar acceso rápido a todos los módulos | Media | ✅ |
| RF-34 | El sistema debe ocultar/deshabilitar opciones según el rol del usuario | Alta | ✅ |
| RF-35 | El sistema debe mostrar el usuario actual en la cabecera | Media | ✅ |

---

## 2. REQUERIMIENTOS NO FUNCIONALES

Los requerimientos no funcionales definen **cómo** debe comportarse el sistema en términos de calidad, rendimiento y restricciones.

### 2.1 Seguridad

| ID | Requerimiento | Descripción |
|----|---------------|-------------|
| RNF-01 | Las contraseñas deben almacenarse con hash bcrypt (factor 10) | No se almacenan en texto plano |
| RNF-02 | Las peticiones a la API deben validar token JWT en endpoints protegidos | Autenticación stateless |
| RNF-03 | La API debe validar y sanitizar todos los datos de entrada (Zod) | Prevención de inyección y datos malformados |
| RNF-04 | La API debe usar Helmet para cabeceras HTTP de seguridad | Protección XSS, clickjacking, etc. |
| RNF-05 | La API debe aplicar CORS configurable por orígenes permitidos | Control de dominios que consumen la API |
| RNF-06 | El rate limit de login debe ser configurable (ventana y máximo de intentos) | Mitigación de ataques de fuerza bruta |

### 2.2 Rendimiento

| ID | Requerimiento | Descripción |
|----|---------------|-------------|
| RNF-07 | La generación de PDF debe completarse en menos de 5 segundos para remisiones típicas | Tiempo de respuesta aceptable |
| RNF-08 | La carga inicial del frontend debe ser inferior a 3 segundos en conexión estándar | Experiencia de usuario fluida |
| RNF-09 | La base de datos SQLite debe soportar al menos 10.000 registros de clientes sin degradación notable | Escalabilidad básica |

### 2.3 Usabilidad

| ID | Requerimiento | Descripción |
|----|---------------|-------------|
| RNF-10 | La interfaz debe ser responsive y usable en pantallas desde 320px de ancho | Acceso desde móviles/tablets |
| RNF-11 | Los mensajes de error deben ser claros y en español | Comprensión por el usuario final |
| RNF-12 | Los formularios deben validar campos antes de enviar y mostrar mensajes de error visibles | Reducción de errores de entrada |
| RNF-13 | Las acciones críticas (eliminar, anular) deben requerir confirmación explícita | Prevención de acciones accidentales |

### 2.4 Mantenibilidad y portabilidad

| ID | Requerimiento | Descripción |
|----|---------------|-------------|
| RNF-14 | El código debe ejecutarse en Node.js 18+ (LTS) | Compatibilidad con entornos estándar |
| RNF-15 | La configuración sensible debe gestionarse mediante variables de entorno (.env) | Sin credenciales en código |
| RNF-16 | El frontend debe construirse con Vite para generación optimizada de producción | Build eficiente |
| RNF-17 | El backend debe poder ejecutarse en un solo proceso sin dependencias externas de BD | Despliegue sencillo |

### 2.5 Disponibilidad y robustez

| ID | Requerimiento | Descripción |
|----|---------------|-------------|
| RNF-18 | La API debe responder con código HTTP apropiado (200, 400, 401, 403, 404, 500) | Integración y depuración |
| RNF-19 | Los errores no controlados no deben exponer información sensible al cliente | Seguridad en producción |
| RNF-20 | La base de datos debe crearse e inicializarse automáticamente si no existe | Arranque sin configuración manual |

### 2.6 Documentación

| ID | Requerimiento | Descripción |
|----|---------------|-------------|
| RNF-21 | El proyecto debe incluir README con estructura, tecnologías e instrucciones de instalación | Onboarding de desarrolladores |
| RNF-22 | Debe existir documentación de entrega y guía paso a paso | Entrega formal y operación |

---

## 3. RESUMEN

| Categoría | Cantidad | Cumplidos |
|-----------|----------|-----------|
| Requerimientos funcionales | 35 | 35 ✅ |
| Requerimientos no funcionales | 22 | 22 ✅ |

---

*Documento de requerimientos del proyecto EPSI HL - Sistema IRIS.*
