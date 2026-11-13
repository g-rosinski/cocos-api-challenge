# feat: exponer correlación, logs canónicos, errores y el middleware de cuenta

## 1. Contexto y objetivo

- **Propósito:** Compartir entre los tres servicios la correlación, el log, el formato de error y la identificación de la cuenta.
- **Alcance (In-Scope):** Header `x-correlation-id`. Log canónico al cerrar cada llamada. Filtro de excepciones. Cuerpos JSON en snake_case. Middleware de `x-user-id` solo en portfolio y órdenes.
- **Fuera de alcance (Out-of-Scope):** Cálculo de la cuenta, búsqueda, máquina de estados e OpenTelemetry.

## 2. Requisitos técnicos y restricciones

- **Stack / Tecnologías:** NestJS: middleware, filtro de excepciones e interceptor. Logger de NestJS. Sin librería de logging adicional hasta verificar si hace falta.
- **Restricciones estrictas:**
  - Sin asunciones: no se agrega un logger de terceros salvo que el de NestJS no pueda emitir el log canónico en una línea. Esa carencia se verifica al implementar.
  - Si la llamada trae `x-correlation-id`, se reutiliza. Si no, se genera un UUID. La respuesta lo devuelve. `GET /health` queda fuera de correlación y del log canónico.
  - El log canónico admite `title`, estado de negocio opcional y `context` vía `CanonicalLogContext`. Nivel `info` por defecto, `warn` en 401/429, `error` desde 500.
  - El log no incluye `email` ni `accountNumber`.
  - `GET /portfolio` y `POST /orders` exigen `x-user-id` entero y una cuenta existente. `GET /instruments` no lo exige.
  - Una falla de PostgreSQL responde 500 sin el detalle interno. El detalle queda en el log del mismo `correlationId`.

## 3. Archivos y recursos de referencia

- **Archivos a modificar/crear:** `src/common/middleware/` (correlation, user-id), `src/common/logging/call-context/`, `src/common/logging/canonical-log/`, `src/common/errors/api-exception.filter.ts`, registro en `src/app.module.ts`.
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

- [x] **Comprobaciones manuales:** `GET /health` no devuelve `x-correlation-id` ni log canónico. `GET /portfolio` sin header responde 400 `INVALID_USER_ID` con correlación en cuerpo y header. Con `x-user-id: 999` responde 404 `USER_NOT_FOUND`.
- [x] **Escenarios de test (Unitarios / E2E):** 17 unitarias y 4 e2e, incluido filtro 400/404/500 y middleware de cuenta.
- [x] **Documentación:** La sección 8 del RFC no cambió. El ajuste de `/health` queda documentado en este ticket.

## Dependencias

TASK-01.
