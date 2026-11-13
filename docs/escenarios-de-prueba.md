# Escenarios de prueba

Guía de las respuestas **guardadas en la colección Postman** y su alineación con [rfc.md](rfc.md) §12. Base: `http://localhost:3000`, seed en [database/seed.sql](../database/seed.sql).

**Colección:** [API Cocos Challenge - Gonzalo Rosinski.postman_collection.json](API%20Cocos%20Challenge%20-%20Gonzalo%20Rosinski.postman_collection.json)  
**Curls equivalentes:** [curls.md](curls.md)

## Reglas globales

- Los escenarios del RFC §12 están pensados para correr **sin arrastrar estado** entre sí, salvo los que explícitamente mutan la base (altas de órdenes).
- Tras órdenes que escriben, los totales del portfolio dejan de coincidir con los del seed.
- Si un ejemplo guardado en Postman muestra un **código HTTP distinto** al de la API (p. ej. metadata `code: 201` con cuerpo de error), manda el **status real** de la respuesta al ejecutar la request hoy; abajo se indica el comportamiento según RFC/implementación.

## Portfolio

| Ejemplo Postman | Request | HTTP | Código / resultado |
| --- | --- | --- | --- |
| Portfolio de cuenta con movimientos | `GET /portfolio`, `x-user-id: 1` | 200 | `total_value` 904784, `cash_balance` 627500, 40 PAMP |
| Portfolio de cuenta sin movimientos | `GET /portfolio`, `x-user-id: 2` | 200 | Totales en 0, `positions` vacío |
| Consultar con cuenta invalida | `GET /portfolio`, `x-user-id: ABC` | 400 | `INVALID_USER_ID` |
| Consultar sin especificar cuenta | `GET /portfolio` (sin header) | 400 | `INVALID_USER_ID` |
| La cuenta no existe. | `GET /portfolio`, `x-user-id: 999` | 404 | `USER_NOT_FOUND` |

RFC: escenarios 1–3. Más detalle: [portfolio.md](portfolio.md).

## Instruments

| Ejemplo Postman | Request | HTTP | Código / resultado |
| --- | --- | --- | --- |
| Buscar por ticker existente | `GET /instruments?q=pamp` | 200 | PAMP, `meta.total` 1 |
| Buscar por nombre existente | `GET /instruments?q=Pampa` | 200 | Igual que ticker |
| Listar catálogo sin búsqueda | `GET /instruments` | 200 | `meta.total` 65, 10 ítems, sin ARS |
| Listar con página de 50 | `GET /instruments?limit=50&offset=0` | 200 | 50 ítems, `meta.total` 65 |
| Buscar texto que solo coincide con moneda | `GET /instruments?q=pesos` | 200 | `data` vacío |
| Buscar por ticker no válido (ARS) | `GET /instruments?q=ARS` | 200 | `data` vacío |
| Segunda página del catálogo | `GET /instruments?limit=10&offset=10` | 200 | Página 2, `meta.total` 65 |

RFC: escenarios 4–7. Más detalle: [instruments.md](instruments.md).

## Orders

### Casos de negocio (`201` con cuerpo de orden)

| Ejemplo Postman | Resultado esperado |
| --- | --- |
| Compra a mercado | `status`: `FILLED`; reduce cash; aumenta tenencia |
| Compra a mercado sin balance | `status`: `REJECTED` |
| Compra tipo Limit | `status`: `NEW`; aparta cash al precio límite |
| Compra tipo Limit sin balance | `status`: `REJECTED` |
| Venta a mercado | `status`: `FILLED` si hay acciones |
| Venta a mercado sin tenencia | `status`: `REJECTED` |
| Venta tipo Limit | `status`: `NEW`; aparta acciones |
| Venta tipo Limit sin tenencia | `status`: `REJECTED` |

RFC: escenarios 8–10.

### Errores HTTP

| Ejemplo Postman | HTTP | `error.code` |
| --- | --- | --- |
| Orden de instrumento inexistente | 404 | `INSTRUMENT_NOT_FOUND` |
| Orden con side invalido | 400 | `INVALID_ORDER_SIDE` |
| Orden con type invalido | 400 | `INVALID_ORDER_TYPE` |
| Orden con clave reutilizada de otra orden | 400 | `IDEMPOTENCY_KEY_MISMATCH` |
| Orden con body inválido | 400 | `VALIDATION_ERROR` |
| Orden con cuenta inexistente. | 404 | `USER_NOT_FOUND` |
| Orden con clave de idempotencia inválida | 400 | `INVALID_IDEMPOTENCY_KEY` |

### Idempotencia (misma clave, mismo cuerpo)

Después de **Compra a mercado** con `Idempotency-Key: 6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21`, repetir la misma request → `201` con la misma orden (`REPLAY` en logs), sin segunda fila en `orders`.

RFC: escenario 8 (párrafo final). Más detalle: [orders.md](orders.md).

## Integración automatizada

`npm run test:integration` cubre mercado ejecutada, límite abierta, rechazo por falta de acciones, replay idempotente y mismatch de hash ([rfc.md](rfc.md) req. 18).
