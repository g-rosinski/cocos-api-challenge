# docs: documentar entrega del challenge, operación local y diseño por feature

## 1. Contexto y objetivo

- **Propósito:** Quien evalúa o clona el repo puede leer el enunciado original, levantar la API con migraciones, ejecutar la colección Postman, entender el scaffolding NestJS y profundizar portfolio, instruments y orders (incluida idempotencia y concurrencia) sin depender solo del código.
- **Alcance (In-Scope):** README operativo; enunciado del proveedor en el repo; índice en `docs/`; guía de demo y observabilidad; matriz de escenarios Postman; tres documentos de dominio con diagramas mermaid; artefacto XState documental para la decisión de estado de una orden; enlace a la colección Postman existente.
- **Fuera de alcance (Out-of-Scope):** Reemplazar [docs/prd.md](../prd.md) o [docs/rfc.md](../rfc.md). Automatizar los escenarios E2E. Corregir metadata HTTP incorrecta en ejemplos guardados de Postman salvo que se abra un ticket aparte.

## 2. Requisitos técnicos y restricciones

- **Stack / Tecnologías:** Markdown en español; diagramas mermaid en los `.md`; JSON importable en Stately para la máquina de órdenes. Sin dependencia npm nueva.
- **Restricciones estrictas:**
  - El texto del [enunciado original](../backend-challenge.md) se versiona tal como lo entrega el challenge; las extensiones (idempotencia, `x-user-id`, logs) se explican como decisión de PRD/RFC, no como parte del archivo del proveedor.
  - Los diagramas de secuencia y flujo deben coincidir con las capas reales: controller, service, port, repository (`*.repository.ts`).
  - La documentación de órdenes debe describir lock pessimista en `users`, tabla `order_idempotency_keys`, hash SHA-256 del payload canónico y replay frente a `IDEMPOTENCY_KEY_MISMATCH`.
  - README debe cubrir Docker y host, `migration:run`, URLs `/swagger` y `/schema.json`, scaffolding resumido y link a la colección Postman.

## 3. Archivos y recursos de referencia

- **Archivos a modificar/crear:**
  - [README.md](../../README.md)
  - [docs/README.md](../README.md)
  - [docs/backend-challenge.md](../backend-challenge.md)
  - [docs/guia-del-challenge.md](../guia-del-challenge.md)
  - [docs/escenarios-de-prueba.md](../escenarios-de-prueba.md)
  - [docs/portfolio.md](../portfolio.md)
  - [docs/instruments.md](../instruments.md)
  - [docs/orders.md](../orders.md)
  - [docs/diagrams/order-machine.machine.json](../diagrams/order-machine.machine.json)
- **Referencias:** [docs/prd.md](../prd.md), [docs/rfc.md](../rfc.md) (§5 migración, §6 logs, §7 OTEL, §12 E2E), [docs/curls.md](../curls.md), [API Cocos Challenge - Gonzalo Rosinski.postman_collection.json](../API%20Cocos%20Challenge%20-%20Gonzalo%20Rosinski.postman_collection.json).

Fuente de producto: enunciado y [docs/prd.md](../prd.md). Fuente técnica: [docs/rfc.md](../rfc.md) y código en `src/modules/`.

## 4. Instrucciones paso a paso

1. **Plan de cambios (Preview):** Listar README, enunciado, índice, guía, escenarios y tres dominios antes de escribir.
2. **Implementación:** Redactar cada documento; alinear tablas Postman con RFC; agregar mermaid y JSON XState.
3. **Documentación:** Registrar la tarea en [docs/tickets/README.md](README.md) como `TASK-10`, dependiente de Swagger, observabilidad y pruebas.

## 5. Resultados esperados y verificación

- [x] **Comprobaciones manuales:** Un evaluador sigue solo el README para levantar con Docker o host y encuentra Swagger, Postman y migraciones.
- [x] **Escenarios de test (Unitarios / E2E):** No aplica suite nueva; los escenarios documentados referencian RFC §12, Postman y `npm run test:integration`.
- [x] **Documentación:** Enunciado, índice, guía de logs, escenarios, portfolio, instruments, orders y máquina XState presentes y enlazados desde README.

## Dependencias

TASK-07, TASK-08, TASK-09.
