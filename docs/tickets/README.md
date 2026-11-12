# Roadmap: API de consulta de cuenta y envío de órdenes

## Visión general

Una API NestJS, en un solo proceso, con tres módulos: cuenta, instrumentos y órdenes. El inversor consulta su cuenta, busca un activo y envía una orden. El comportamiento de producto está en [docs/prd.md](../prd.md). El detalle técnico de implementación está en [docs/rfc.md](../rfc.md).

El orden de implementación es el de la matriz: primero el repositorio y la base, después el borde HTTP, después los tres servicios, y al final Swagger, observabilidad y pruebas.

## Estado de progreso

- **Progreso general:** `[▓▓▓▓░░░░░] 44%`
- **Total de tareas:** 9
- **Completadas:** 4
- **En progreso:** 0

---

## Matriz de dependencias

| ID tarea | Tipo | Tarea | Dependencias | Estado |
| --- | --- | --- | --- | --- |
| `TASK-01` | `chore` | Preparar NestJS, Docker, lint, commits y reglas de Cursor | Ninguna | `[x] Completado` |
| `TASK-02` | `chore` | Conectar PostgreSQL, cargar el seed y correr la migración | `TASK-01` | `[x] Completado` |
| `TASK-03` | `feat` | Correlación, logs, errores y middleware de cuenta | `TASK-01` | `[x] Completado` |
| `TASK-04` | `feat` | Consultar el portfolio | `TASK-02`, `TASK-03` | `[ ] Pendiente` |
| `TASK-05` | `feat` | Buscar instrumentos con paginado | `TASK-02`, `TASK-03` | `[x] Completado` |
| `TASK-06` | `feat` | Crear órdenes con lock, estados e idempotencia | `TASK-02`, `TASK-03` | `[ ] Pendiente` |
| `TASK-07` | `feat` | Publicar Swagger y schema.json | `TASK-04`, `TASK-05`, `TASK-06` | `[ ] Pendiente` |
| `TASK-08` | `feat` | Atributos de OpenTelemetry | `TASK-03`, `TASK-06` | `[ ] Pendiente` |
| `TASK-09` | `test` | Pruebas unitarias y de integración del envío | `TASK-04`, `TASK-05`, `TASK-06` | `[ ] Pendiente` |

Redis no tiene tarea. El RFC lo deja para después, delante de la búsqueda, sin cambiar el contrato.

---

## Lista de tareas detallada

### [TASK-01] chore: preparar el proyecto NestJS con Docker, lint y reglas de Cursor
- **Estado:** `[x] Completado`
- **Archivo de tarea:** [01-bootstrap.md](01-bootstrap.md)
- **Resultados:** NestJS 12 arranca en Node 26 si existe `DATABASE_URL`. Husky rechaza formato y mensajes de commit inválidos.

### [TASK-02] chore: conectar PostgreSQL con TypeORM y aplicar la migración aditiva
- **Estado:** `[x] Completado`
- **Archivo de tarea:** [02-base-de-datos.md](02-base-de-datos.md)
- **Resultados:** TypeORM 1.1.2 conecta a `neondb` con `synchronize` apagado. La migración aditiva quedó aplicada en la base local.

### [TASK-03] feat: exponer correlación, logs canónicos, errores y el middleware de cuenta
- **Estado:** `[x] Completado`
- **Archivo de tarea:** [03-borde-http.md](03-borde-http.md)
- **Resultados:** Correlación, log canónico y errores RFC en el borde. `/health` queda excluido. `GET /portfolio` valida `x-user-id` contra `users`.

### [TASK-04] feat: consultar el portfolio calculado desde órdenes y el último cierre
- **Estado:** `[ ] Pendiente`
- **Archivo de tarea:** [04-portfolio.md](04-portfolio.md)
- **Siguiente paso:** Revisar el plan de cambios y el ejemplo de Emiliano en el PRD.

### [TASK-05] feat: buscar instrumentos por ticker o nombre con paginado
- **Estado:** `[x] Completado`
- **Archivo de tarea:** [05-busqueda-de-instrumentos.md](05-busqueda-de-instrumentos.md)
- **Resultados:** `GET /instruments` busca por ticker o nombre, excluye `MONEDA`, pagina con `limit` 10 y `offset` 0, y valida la query con Zod.

### [TASK-06] feat: crear órdenes con bloqueo pesimista, estados e idempotencia
- **Estado:** `[ ] Pendiente`
- **Archivo de tarea:** [06-alta-de-ordenes.md](06-alta-de-ordenes.md)
- **Siguiente paso:** Revisar el plan de cambios antes de implementar la transacción.

### [TASK-07] feat: publicar Swagger y schema.json con ejemplos del seed
- **Estado:** `[ ] Pendiente`
- **Archivo de tarea:** [07-swagger.md](07-swagger.md)
- **Siguiente paso:** Revisar el plan de cambios cuando los tres servicios respondan.

### [TASK-08] feat: instrumentar llamadas con atributos de OpenTelemetry sin un vendor
- **Estado:** `[ ] Pendiente`
- **Archivo de tarea:** [08-observabilidad.md](08-observabilidad.md)
- **Siguiente paso:** Revisar el plan de cambios y la tabla de PII del RFC.

### [TASK-09] test: cubrir con pruebas unitarias y de integración el envío de órdenes
- **Estado:** `[ ] Pendiente`
- **Archivo de tarea:** [09-pruebas.md](09-pruebas.md)
- **Siguiente paso:** Revisar el plan de cambios y los escenarios E2E del RFC.

---

## Bitácora de actualizaciones y contexto

- **2026-11-11:** Roadmap reescrito con 9 tareas. Fuente de producto: `docs/prd.md`. Fuente técnica: `docs/rfc.md`.
- **2026-11-11:** `TASK-01` completada. Proceso NestJS, lint, hooks y `.cursor/rules/architecture.mdc`. La imagen Docker no se construyó en esta máquina porque el comando `docker` no está instalado.
- **2026-11-11:** `TASK-05` completada. `GET /instruments` con puerto, adaptador PostgreSQL, Zod y tests unitarios. El RFC sección 11 no cambió.
