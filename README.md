# EPSI HL - Sistema IRIS

Esta carpeta contiene el proyecto Sistema IRIS con los módulos solicitados:

- Remisiones en PDF con formato institucional y trazabilidad por usuario.
- Gestión de turnos con calendario y notificaciones WhatsApp.
- Gestión de usuarios y roles con JWT (login requerido para remisiones).
- BI con métricas y gráficas.

## Estructura propuesta

- `backend/` API REST (Node.js + Express).
- `frontend/` UI web (React + Vite).
- `docs/` guía paso a paso.

## Estado actual

- UI renovada con sidebar y hero.
- Remisiones requieren login para generar PDF.
- Consecutivo automático RM 001, RM 002, ...
- IVA 19% calculado sobre el total ingresado.
- PDF con fecha/hora en pie de página y usuario autenticado.

## Primer paso

Sigue la guía en `docs/paso-a-paso.md`.
