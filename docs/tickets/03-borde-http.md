# feat: exponer correlación, logs canónicos, errores y el middleware de cuenta

## 1. Contexto y objetivo

- **Propósito:** Compartir entre los tres servicios la correlación, el log, el formato de error y la identificación de la cuenta.
- **Alcance (In-Scope):** Header `x-correlation-id`. Log canónico al cerrar cada llamada. Filtro de excepciones. Cuerpos JSON en snake_case. Middleware de `x-user-id` solo en portfolio y órdenes.
- **Fuera de alcance (Out-of-Scope):** Cálculo de la cuenta, búsqueda, máquina de estados e OpenTelemetry.

## 2. Requisitos técnicos y restricciones

- **Stack / Tecnologías:** NestJS: middleware, filtro de excepciones e interceptor. Logger de NestJS. Sin librería de logging adicional hasta verificar si hace falta.
- **Restricciones estrictas:**
  - Sin asunciones: no se agrega un logger de terceros salvo que el de NestJS no pueda emitir el log canónico en una línea. Esa carencia se verifica al implementar.
  - Si la llamada trae `x-correlation-id`, se reutiliza. Si no, se genera un UUID. La respuesta lo devuelve.
  - El log no incluye `email` ni `accountNumber`.
  - `GET /portfolio` y `POST /orders` exigen `x-user-id` entero y una cuenta existente. `GET /instruments` no lo exige.
  - Una falla de PostgreSQL responde 500 sin el detalle interno. El detalle queda en el log del mismo `correlationId`.

## 3. Archivos y recursos de referencia

- **Archivos a modificar/crear:** `src/common/correlation/`, `src/common/filters/api-exception.filter.ts`, `src/common/middleware/user-id.middleware.ts`, registro en `src/app.module.ts`.
- **Firma / Contrato propuesto:**

```typescript
type ClientErrorCode =
  | 'INVALID_USER_ID'
  | 'VALIDATION_ERROR'
  | 'USER_NOT_FOUND'
  | 'INSTRUMENT_NOT_FOUND'
  | 'INSTRUMENT_NOT_TRADABLE'
  | 'PRICE_UNAVAILABLE'
  | 'INVALID_IDEMPOTENCY_KEY'
  | 'IDEMPOTENCY_KEY_MISMATCH';

type ErrorResponse = {
  error: {
    code: ClientErrorCode | 'INTERNAL_ERROR';
    message: string;
    correlation_id: string;
  };
};
```

Fuente técnica: secciones 6 y 8 de [docs/rfc.md](../rfc.md).

## 4. Instrucciones paso a paso

1. **Plan de cambios (Preview):** Listar middleware, interceptor y filtro, y qué rutas usa cada uno, antes de editar.
2. **Implementación:** Generar o reutilizar el `correlationId`. Escribir el log canónico al finalizar la llamada. Mapear las excepciones al cuerpo de error. Aplicar el middleware de cuenta solo a portfolio y órdenes.
3. **Documentación:** Si aparece un código de error nuevo, agregarlo a la tabla de la sección 8 del RFC.

## 5. Resultados esperados y verificación

- [ ] **Comprobaciones manuales:** Una llamada sin `x-correlation-id` recibe uno, y el log usa el mismo valor. Portfolio y órdenes sin header, o con un valor que no es entero, responden 400 `INVALID_USER_ID`. Un usuario inexistente responde 404 `USER_NOT_FOUND`.
- [ ] **Escenarios de test (Unitarios / E2E):** Prueba unitaria del filtro para 400, 404 y 500. Prueba unitaria del middleware con header ausente, no entero, usuario inexistente y usuario existente.
- [ ] **Documentación:** La sección 8 del RFC sigue describiendo los mismos cuerpos.

## Dependencias

TASK-01.
