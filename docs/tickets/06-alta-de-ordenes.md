# feat: crear órdenes con bloqueo pesimista, estados e idempotencia

## 1. Contexto y objetivo

- **Propósito:** `POST /orders` registra una compra o una venta y responde el estado final en la misma llamada, sin doble gasto y sin repetir una orden ya aceptada.
- **Alcance (In-Scope):** Máquina de estados. Strategy de mercado y de límite, elegidas por una factory. Transacción con `SELECT … FOR UPDATE` de la cuenta. Header `Idempotency-Key` obligatorio. Hash del cuerpo. Logs de recibida, validada y log canónico posterior al commit.
- **Fuera de alcance (Out-of-Scope):** Cancelar una orden. Ejecutar después una límite `NEW`. Cargar depósitos o retiros.

## 2. Requisitos técnicos y restricciones

- **Stack / Tecnologías:** NestJS. TypeORM, con query runner y lock pesimista de escritura. `crypto` de Node.js para SHA-256. PostgreSQL.
- **Restricciones estrictas:**
  - Sin asunciones: no se usa un paquete externo de idempotencia ni de máquinas de estados salvo que se documente en el RFC antes de instalarlo.
  - El cálculo de disponibles ocurre después del `FOR UPDATE`. El cálculo anterior no se usa.
  - El tramo con lock no llama a la red ni escribe logs.
  - `Idempotency-Key` es un UUID. Si falta o no lo es, 400 `INVALID_IDEMPOTENCY_KEY` y no se abre la transacción de creación.
  - El hash es SHA-256 en hexadecimal de un JSON canónico, con claves ordenadas: `instrument_id`, `side`, `type`, `size` o `amount`, y `price` cuando viene. Se guarda en `payload_hash`. El DDL está solo en la migración de la sección 5.
  - Llave nueva: se procesa y se guarda. Mismo hash: se devuelve el 201 ya guardado, sin otra orden. Otro hash: 400 `IDEMPOTENCY_KEY_MISMATCH`.
  - Falta de pesos, de acciones, monto menor a una acción o venta bajo cero: commit y 201 `REJECTED`.
  - Instrumento `MONEDA`, cuerpo inválido o cierre ausente cuando hace falta: 400 y no se inserta la orden.
  - La respuesta identifica la orden con `order_id`, no con la clave.

## 3. Archivos y recursos de referencia

- **Archivos a modificar/crear:** `src/orders/orders.module.ts`, `src/orders/orders.controller.ts`, `src/orders/create-order.service.ts`, `src/orders/order-state-machine.ts`, `src/orders/strategies/`, `src/orders/order-strategy.factory.ts`, repositorio de la transacción.
- **Firma / Contrato propuesto:**

```typescript
type OrderSide = 'BUY' | 'SELL';
type OrderType = 'MARKET' | 'LIMIT';
type OrderStatus = 'FILLED' | 'NEW' | 'REJECTED';

type CreateOrderBody = {
  instrument_id: number;
  side: OrderSide;
  type: OrderType;
  size?: number;
  amount?: number;
  price?: number;
};

type OrderResponse = {
  order_id: number;
  user_id: number;
  instrument_id: number;
  side: OrderSide;
  type: OrderType;
  size: number;
  price: number;
  status: OrderStatus;
  datetime: string;
};
```

Fuente de producto: historia "Enviar una orden" de [docs/prd.md](../prd.md). Fuente técnica: secciones 9 y 11 de [docs/rfc.md](../rfc.md).

## 4. Instrucciones paso a paso

1. **Plan de cambios (Preview):** Dibujar el orden de la transacción (buscar clave, lock, recalcular, decidir, insertar orden, insertar clave) y los archivos, antes de codificar.
2. **Implementación:** Implementar la máquina, las dos strategies y la factory. Abrir la transacción solo para una llave nueva o para resolver la carrera del índice único. Escribir los tres logs en los momentos del RFC.
3. **Documentación:** No copiar el `CREATE TABLE` a otro archivo de docs. Si cambia una columna, se cambia la migración y la sección 9 solo actualiza la referencia.

## 5. Resultados esperados y verificación

- [ ] **Comprobaciones manuales:** Compra a mercado de 1 PAMP con la cuenta 1 responde 201 `FILLED`; la cuenta queda en 41 PAMP y el disponible baja 925.85. Compra límite de 1 Loma Negra a 710 responde 201 `NEW`, sin posición nueva, y el disponible baja 710.00. Venta de 1000 PAMP responde 201 `REJECTED` y la tenencia sigue en 40.
- [x] **Escenarios de test (Unitarios / E2E):** Prueba unitaria de la máquina y de cada strategy. Prueba de la factory con `MARKET` y `LIMIT`. La integración contra PostgreSQL queda en TASK-09.
- [x] **Documentación:** Los ejemplos de la sección 11 del RFC siguen siendo ejecutables con estos cuerpos. El `CREATE TABLE` no se copió.

## Dependencias

TASK-02, TASK-03.
