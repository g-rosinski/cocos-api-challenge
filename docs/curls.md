# Curls de prueba

Base local: `http://localhost:3000`. Los cuerpos y headers son los del seed y los de la sección 12 del RFC. La interfaz está en `/swagger` y el documento importable en `/schema.json`.

La consulta de la cuenta tiene que correr antes de las órdenes si se quieren los totales del seed. Las órdenes 12, 13, 14 y 15 escriben en la base. El desajuste de idempotencia se envía después de la orden a mercado, porque reutiliza su clave.

`order_id` y `datetime` de las respuestas de alta dependen de la base. Los valores del Swagger ilustran la forma.

## 1. Ver la cuenta

```bash
curl --request GET "http://localhost:3000/portfolio" --header "x-user-id: 1"
```

Respuesta `200`. `summary.total_value` es 904784.00 y `summary.cash_balance` es 627500.00. Banco Macro no aparece. Hay 40 PAMP.

## 2. Portfolio sin cuenta

```bash
curl --request GET "http://localhost:3000/portfolio"
```

Respuesta `400` `INVALID_USER_ID`.

## 3. Portfolio de cuenta sin movimientos

```bash
curl --request GET "http://localhost:3000/portfolio" --header "x-user-id: 2"
```

Respuesta `200`. Totales en cero y `positions` vacío.

## 4. Portfolio con identificador inválido

```bash
curl --request GET "http://localhost:3000/portfolio" --header "x-user-id: ABC"
```

Respuesta `400` `INVALID_USER_ID`.

## 5. Portfolio de una cuenta que no existe

```bash
curl --request GET "http://localhost:3000/portfolio" --header "x-user-id: 999"
```

Respuesta `404` `USER_NOT_FOUND`.

La misma cuenta inexistente, enviando una orden:

```bash
curl --request POST "http://localhost:3000/orders" \
  --header "content-type: application/json" \
  --header "x-user-id: 999" \
  --header "Idempotency-Key: 9c4d5e6f-7081-4902-c234-d5e6f708192a" \
  --data "{\"instrument_id\":47,\"side\":\"BUY\",\"type\":\"MARKET\",\"size\":1}"
```

Respuesta `404` `USER_NOT_FOUND`.

## 6. Buscar por ticker

```bash
curl --request GET "http://localhost:3000/instruments?q=pamp&limit=10&offset=0"
```

Respuesta `200`. `data` trae PAMP (`instrument_id` 47) y `meta.total` es 1. La búsqueda no pide `x-user-id`.

## 7. Buscar por nombre

```bash
curl --request GET "http://localhost:3000/instruments?q=Pampa&limit=10&offset=0"
```

Respuesta `200`. Mismo resultado que por ticker: PAMP y `meta.total` 1.

## 8. Primera página sin texto

```bash
curl --request GET "http://localhost:3000/instruments"
```

Respuesta `200`. `meta.total` es 65, la página trae 10 activos y ninguno es `ARS`.

## 9. Página de 50 activos

```bash
curl --request GET "http://localhost:3000/instruments?limit=50&offset=0"
```

Respuesta `200`. `meta.limit` es 50, `meta.total` sigue en 65 y `data` trae 50 activos (el último ticker de la página es `PATA`). `ARS` no aparece.

## 10. Búsqueda que solo coincide con la moneda

```bash
curl --request GET "http://localhost:3000/instruments?q=pesos"
curl --request GET "http://localhost:3000/instruments?q=ARS"
```

Las dos responden `200` con `data` vacío y `meta.total` 0.

## 11. Segunda página, con limit

```bash
curl --request GET "http://localhost:3000/instruments?limit=10&offset=10"
```

Respuesta `200`. `meta.total` sigue en 65 y el primer ticker de la página es `CAPX`.

## 12. Orden a mercado ejecutada

```bash
curl --request POST "http://localhost:3000/orders" \
  --header "content-type: application/json" \
  --header "x-user-id: 1" \
  --header "Idempotency-Key: 6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21" \
  --data "{\"instrument_id\":47,\"side\":\"BUY\",\"type\":\"MARKET\",\"size\":1}"
```

Respuesta `201` `FILLED`, sobre PAMP, `size` 1. Una consulta posterior de la cuenta muestra 41 PAMP y un `cash_balance` menor en 925.85.

Repetir el mismo curl devuelve ese mismo `201` y no crea otra orden.

## 13. Orden límite abierta (compra)

```bash
curl --request POST "http://localhost:3000/orders" \
  --header "content-type: application/json" \
  --header "x-user-id: 1" \
  --header "Idempotency-Key: 7a2b3c4d-5e6f-4789-a012-b3c4d5e6f789" \
  --data "{\"instrument_id\":45,\"side\":\"BUY\",\"type\":\"LIMIT\",\"size\":1,\"price\":710}"
```

Respuesta `201` `NEW`, precio 710.00. Loma Negra no aparece como posición nueva. `summary.cash_balance` baja 710.00. `summary.total_value` no cambia por este apartado.

## 14. Orden rechazada (venta a mercado)

```bash
curl --request POST "http://localhost:3000/orders" \
  --header "content-type: application/json" \
  --header "x-user-id: 1" \
  --header "Idempotency-Key: 8b3c4d5e-6f70-4891-b123-c4d5e6f70891" \
  --data "{\"instrument_id\":47,\"side\":\"SELL\",\"type\":\"MARKET\",\"size\":1000}"
```

Respuesta `201` `REJECTED`. Hay 40 PAMP disponibles antes de esta venta. La cuenta queda igual.

## 15. Orden límite abierta (venta)

```bash
curl --request POST "http://localhost:3000/orders" \
  --header "content-type: application/json" \
  --header "x-user-id: 1" \
  --header "Idempotency-Key: 9d4e5f6a-7b80-4901-c234-e5f6a708192b" \
  --data "{\"instrument_id\":47,\"side\":\"SELL\",\"type\":\"LIMIT\",\"size\":1,\"price\":1200}"
```

Respuesta `201` `NEW`, precio 1200.00. Queda una venta límite abierta sobre PAMP.

## 16. Orden inválida

Sin clave:

```bash
curl --request POST "http://localhost:3000/orders" \
  --header "content-type: application/json" \
  --header "x-user-id: 1" \
  --data "{\"instrument_id\":47,\"side\":\"BUY\",\"type\":\"MARKET\",\"size\":1}"
```

Clave que no es un UUID:

```bash
curl --request POST "http://localhost:3000/orders" \
  --header "content-type: application/json" \
  --header "x-user-id: 1" \
  --header "Idempotency-Key: no-es-uuid" \
  --data "{\"instrument_id\":47,\"side\":\"BUY\",\"type\":\"MARKET\",\"size\":1}"
```

Las dos responden `400` `INVALID_IDEMPOTENCY_KEY`.

Misma clave que la orden 12, con otro cuerpo. Corre después de esa orden:

```bash
curl --request POST "http://localhost:3000/orders" \
  --header "content-type: application/json" \
  --header "x-user-id: 1" \
  --header "Idempotency-Key: 6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21" \
  --data "{\"instrument_id\":47,\"side\":\"SELL\",\"type\":\"MARKET\",\"size\":1}"
```

Respuesta `400` `IDEMPOTENCY_KEY_MISMATCH`.

Cuerpo vacío, con un UUID nuevo:

```bash
curl --request POST "http://localhost:3000/orders" \
  --header "content-type: application/json" \
  --header "x-user-id: 1" \
  --header "Idempotency-Key: 0a1b2c3d-4e5f-4678-9012-abcdefabcdef" \
  --data "{}"
```

Respuesta `400` `VALIDATION_ERROR`.

## 17. Base caída

Con PostgreSQL detenido, cualquiera de los tres servicios responde `500` `INTERNAL_ERROR`. El cuerpo no describe la falla. No forma parte de la corrida contra el seed.

## 18. Importar el schema

Con la API levantada, importar en Postman `http://localhost:3000/schema.json`. Los ejemplos que quedan seleccionados son la cuenta 1, `q=pamp` y la orden de compra de 1 PAMP. Se ejecutan contra el seed sin reescribir cuerpo ni headers. El resto de los casos de esta página está en el desplegable de ejemplos de cada operación.
