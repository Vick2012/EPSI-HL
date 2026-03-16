# Corte a PostgreSQL

## Objetivo
Dejar PostgreSQL como fuente principal de verdad del backend y retirar SQLite del runtime normal de la aplicación.

## Pre-requisitos
- Instancia PostgreSQL disponible y accesible desde el backend.
- Variables de entorno PostgreSQL configuradas (`DATABASE_URL`, `PGSSL` si aplica).
- Respaldo del archivo `backend/data/iris.db`.
- Ventana de mantenimiento para congelar nuevas escrituras durante el corte final.

## Secuencia recomendada
1. Verificar conectividad a PostgreSQL desde el servidor backend.
2. Ejecutar `npm run db:migrate` para crear o actualizar el esquema.
3. Ejecutar `npm run db:migrate:sqlite` para copiar datos existentes desde SQLite.
4. Validar conteos por tabla:
   - `users`
   - `password_resets`
   - `clientes`
   - `remisiones`
5. Arrancar el backend apuntando a PostgreSQL.
6. Ejecutar validación funcional:
   - login
   - `/auth/me`
   - listado/creación/edición de usuarios
   - consulta/guardado/exportación de clientes
   - siguiente consecutivo de remisiones
   - creación, edición y consulta de remisiones
   - generación de PDF
7. Confirmar creación de nuevos registros en PostgreSQL.
8. Mantener `iris.db` solo como respaldo histórico.

## Checklist de validación
- El endpoint `/health` responde correctamente.
- Los usuarios existentes pueden autenticarse.
- Los permisos por rol siguen funcionando.
- Las contraseñas visibles y resets temporales siguen operando.
- Los clientes importados aparecen completos.
- Las remisiones históricas se pueden consultar.
- Las nuevas remisiones generan PDF sin error.
- El consecutivo no duplica números bajo uso concurrente.

## Rollback
Si el corte falla:
1. Detener el backend conectado a PostgreSQL.
2. Restaurar la configuración previa del backend apuntando a SQLite.
3. Reiniciar la API con la configuración anterior.
4. Revisar logs y corregir el problema antes de reintentar el corte.
