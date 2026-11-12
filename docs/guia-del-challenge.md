# Guía del challenge — demo y observabilidad

Esta guía cruza el [enunciado original](backend-challenge.md) con lo que hay en el repo, y explica **cómo validar cada feature** y **qué buscar en los logs**.

## Mapa enunciado → implementación

| Bloque del enunciado | Implementación | Profundizar |
| --- | --- | --- |
| Portfolio (valor total, cash, posiciones) | `GET /portfolio` + header `x-user-id` | [portfolio.md](portfolio.md) |
| Buscar activos (ticker / nombre) | `GET /instruments?q=&limit=&offset=` | [instruments.md](instruments.md) |
| Enviar orden MARKET / LIMIT | `POST /orders` + `x-user-id` + `Idempotency-Key` | [orders.md](orders.md) |
| Estados NEW, FILLED, REJECTED, CANCELLED | Alta con estados resultantes; CANCELLED solo en seed | [orders.md](orders.md) |
| CASH_IN / CASH_OUT en `orders` | Incluidos en cálculo de cash y tenencia | [portfolio.md](portfolio.md) |
| Precio MARKET = último `close` | Lectura de `marketdata` en transacción de orden | [orders.md](orders.md) |
| Colección Postman (nice to have) | [Postman](API%20Cocos%20Challenge%20-%20Gonzalo%20Rosinski.postman_collection.json) | [escenarios-de-prueba.md](escenarios-de-prueba.md) |
| Test funcional de envío de orden | `npm run test:integration` | [rfc.md](rfc.md) req. 18 |

Extensiones documentadas en [prd.md](prd.md) / [rfc.md](rfc.md) y no en el enunciado: idempotencia, correlación, migración aditiva, OpenTelemetry sin vendor.

## Cómo leer logs y correlación

1. Cada respuesta (salvo `GET /health`) devuelve header **`x-correlation-id`**. Podés enviar el tuyo en la petición; si no, la API lo genera.
2. En errores públicos, el JSON trae `error.correlation_id` con el mismo valor.
3. En la consola del proceso, al terminar la request aparece una **línea JSON** de log canónico con `message`, `correlationId`, método, ruta, status HTTP, duración y `context` (ver [rfc.md](rfc.md) §6).
4. En `POST /orders`, además hay eventos `order_received` y `order_validated` en el servicio antes del log canónico.

Para seguir una llamada:

```bash
# Ejemplo: guardar el correlation id del header o del body de error
# y filtrar en stdout (PowerShell / bash según tu entorno)
npm run start:dev 2>&1 | grep '8f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21'
```

OpenTelemetry: si definís `OTEL_EXPORTER_OTLP_ENDPOINT`, se exportan trazas con `correlationId`, ruta, `httpStatus` y, en órdenes, `orderSide`, `orderType`, `orderStatus` ([rfc.md](rfc.md) §7). Sin esa variable, el SDK corre pero no exporta fuera del proceso.

## Orden sugerida al probar

1. Con el seed intacto, **`GET /portfolio`** con `x-user-id: 1` (totales de Emiliano: ver [rfc.md](rfc.md) §12 escenario 1).
2. **`GET /instruments`** sin mutar datos.
3. **`POST /orders`** que escriben en la base solo cuando quieras demostrar altas (compra a mercado, límite, rechazo). Después de una compra a mercado, probá **replay** con la misma `Idempotency-Key` y el mismo cuerpo.

Detalle y nombres Postman: [escenarios-de-prueba.md](escenarios-de-prueba.md). Curls: [curls.md](curls.md).

## Por feature

### Portfolio — `GET /portfolio`

**Qué validar (cuenta 1, seed sin órdenes nuevas):**

- `summary.total_value` = 904784.00
- `summary.cash_balance` = 627500.00
- PAMP: 40 acciones; Banco Macro no aparece

**Observar:**

- Header `x-correlation-id`.
- Log canónico con `userId` en `context`.
- Span OTEL con `userId` en la ruta.

### Instruments — `GET /instruments`

**Qué validar:**

- `?q=pamp` y `?q=Pampa` devuelven PAMP (`instrument_id` 47).
- Sin `q`: catálogo paginado, `meta.total` 65, sin instrumento ARS / MONEDA.
- `?q=pesos` o `?q=ARS`: `data` vacío.

**Observar:**

- Log canónico con texto de búsqueda y paginación en `context`.
- Span **sin** `userId` (no hay cuenta en esta ruta).

### Orders — `POST /orders`

**Qué validar:**

- MARKET aceptada → `201` + `FILLED`; cuenta cambia.
- LIMIT aceptada → `201` + `NEW`; cash o acciones **apartados**, posición FILLED no cambia hasta ejecución futura (fuera de alcance).
- Sin cash/acciones → `201` + `REJECTED` (no es error HTTP).
- Misma `Idempotency-Key` + mismo cuerpo → replay `201` sin segunda fila.
- Misma clave + cuerpo distinto → `400` `IDEMPOTENCY_KEY_MISMATCH`.

**Observar (orden típica en stdout):**

1. `{"event":"order_received",...}`
2. `{"event":"order_validated","result":"FILLED"|"NEW"|"REJECTED"|"REPLAY"|...}`
3. Log canónico de la request con estado HTTP `201` y contexto de orden.

Headers obligatorios: `x-user-id`, `Idempotency-Key` (UUID), `Content-Type: application/json`.

## Criterio de éxito del challenge (resumen)

Tomado del [PRD](prd.md): cuenta de ejemplo correcta, búsqueda operativa, órdenes con estado coherente, y prueba automatizada del envío (`npm run test:integration`).
