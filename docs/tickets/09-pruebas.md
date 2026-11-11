# test: cubrir con pruebas unitarias y de integración el envío de órdenes

## 1. Contexto y objetivo

- **Propósito:** Verificar las reglas sin servidor y el envío de una orden contra PostgreSQL, con el mismo código que usa la API.
- **Alcance (In-Scope):** Pruebas unitarias de las reglas de cuenta y de orden, de la máquina de estados, de las strategies, de cada servicio, del middleware y del mapeo de errores. Prueba de integración del envío contra PostgreSQL. Los escenarios E2E del RFC quedan como guía manual.
- **Fuera de alcance (Out-of-Scope):** Automatizar los trece escenarios E2E. Llamar "prueba funcional" a la integración. Usar una base en memoria para el envío.

## 2. Requisitos técnicos y restricciones

- **Stack / Tecnologías:** El runner de tests que traiga el proyecto NestJS creado en TASK-01. PostgreSQL para la integración. La versión del runner se verifica al implementar y no se reemplaza por otro framework de tests sin anotarlo en el RFC.
- **Restricciones estrictas:**
  - Sin asunciones: la integración usa la misma máquina de estados, las mismas strategies y el mismo repositorio que `POST /orders`.
  - La suite unitaria no abre una base ni un servidor.
  - `npm run test:cov` exige 80% sobre el código unitario (`common`, `config` y utilidades de `database`). Quedan fuera migraciones, bootstrap y cableado Nest (`main`, `*.module.ts`, `health`).
  - La integración cubre mercado ejecutada, límite abierta, rechazada por falta de acciones, reintento con la misma clave y el mismo hash, y la misma clave con otro hash.
  - Un reintento con el mismo hash no inserta una segunda orden. Un hash distinto no inserta y termina en `IDEMPOTENCY_KEY_MISMATCH`.

## 3. Archivos y recursos de referencia

- **Archivos a modificar/crear:** `src/portfolio/*.spec.ts`, `src/instruments/*.spec.ts`, `src/orders/*.spec.ts`, `src/common/**/*.spec.ts`, y una carpeta de integración del envío, por ejemplo `test/orders.integration-spec.ts`. La ruta final se confirma en el plan de cambios.
- **Firma / Contrato propuesto:** No hay un contrato HTTP nuevo. Los casos usan `CreateOrderBody` y `OrderResponse` de TASK-06.

Fuente de producto: criterio de la prueba de envío en [docs/prd.md](../prd.md). Fuente técnica: requerimiento 18 y sección 12 de [docs/rfc.md](../rfc.md).

## 4. Instrucciones paso a paso

1. **Plan de cambios (Preview):** Separar en una lista qué es unitario y qué corre contra PostgreSQL, antes de escribir tests.
2. **Implementación:** Escribir las unitarias de los módulos ya creados. Levantar la integración sobre la base del compose, con el seed y la migración aplicados.
3. **Documentación:** En el roadmap, no renombrar la integración como prueba funcional.

## 5. Resultados esperados y verificación

- [ ] **Comprobaciones manuales:** Recorrer a mano los escenarios E2E de la sección 12 del RFC sobre el seed y anotar el que no coincida.
- [ ] **Escenarios de test (Unitarios / E2E):** La suite unitaria pasa sin base ni servidor. La integración pasa contra PostgreSQL y cubre los cinco casos del alcance.
- [ ] **Documentación:** El requerimiento 18 del RFC y esta tarea usan los mismos nombres: prueba unitaria, prueba de integración y escenarios E2E.

## Dependencias

TASK-04, TASK-05, TASK-06.
