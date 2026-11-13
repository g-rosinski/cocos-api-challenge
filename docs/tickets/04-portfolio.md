# feat: consultar el portfolio calculado desde órdenes y el último cierre

## 1. Contexto y objetivo

- **Propósito:** `GET /portfolio` muestra el valor total, los pesos disponibles y las posiciones de la cuenta indicada en `x-user-id`.
- **Alcance (In-Scope):** Cálculo desde `orders` y el `close` de la `date` más reciente de `marketdata`. Respuesta con `summary` y `positions`.
- **Fuera de alcance (Out-of-Scope):** Alta de órdenes. Retorno diario en la respuesta. Tabla de posiciones.

## 2. Requisitos técnicos y restricciones

- **Stack / Tecnologías:** NestJS. TypeORM. PostgreSQL. El módulo no importa el controlador de órdenes.
- **Restricciones estrictas:**
  - Sin asunciones: las fórmulas son las del PRD y del RFC. No se inventa otro costo promedio.
  - El disponible resta las compras límite `NEW`. El valor total no resta ese apartado.
  - Una venta límite `NEW` aparta acciones.
  - `REJECTED` y `CANCELLED` no mueven la cuenta.
  - No se listan la moneda, ni cantidad cero, ni cantidad negativa.
  - Importes con dos decimales. `total_return_percentage` con dos decimales.
  - Posiciones ordenadas por `ticker`.

## 3. Archivos y recursos de referencia

- **Archivos a modificar/crear:** `src/portfolio/portfolio.module.ts`, `src/portfolio/portfolio.controller.ts`, `src/portfolio/portfolio.service.ts`, `portfolio-response.types.ts`.
- **Firma / Contrato propuesto:**

```typescript
type PositionResponse = {
  instrument_id: number;
  ticker: string;
  name: string;
  quantity: number;
  market_value: number;
  total_return_percentage: number;
};

type PortfolioResponse = {
  summary: {
    total_value: number;
    cash_balance: number;
    currency: 'ARS';
  };
  positions: PositionResponse[];
};
```

Fuente de producto: historia "Ver la cuenta" de [docs/prd.md](../prd.md). Fuente técnica: sección 11 de [docs/rfc.md](../rfc.md).

## 4. Instrucciones paso a paso

1. **Plan de cambios (Preview):** Explicar la consulta, el redondeo y los archivos del módulo antes de implementar.
2. **Implementación:** Crear el módulo. Calcular efectivo liquidado, reservas, cantidades y rendimiento. Excluir lo que el RFC excluye. Devolver el contrato de arriba.
3. **Documentación:** Si el ejemplo de Emiliano no cierra con el seed, corregir el número en el PRD y en el RFC juntos, no solo en el código.

## 5. Resultados esperados y verificación

- [x] **Comprobaciones manuales:** `GET /portfolio` con `x-user-id: 1` y el seed intacto responde 200 con `total_value` 904784.00, `cash_balance` 627500.00, MetroGAS y Pampa. Banco Macro no aparece. Si la cuenta 1 tiene órdenes `POST` adicionales, el `cash_balance` baja por las reservas `NEW` nuevas y el `total_value` puede seguir igual.
- [x] **Escenarios de test (Unitarios / E2E):** `portfolio-calculator.spec.ts` cubre `FILLED`, `NEW`, `REJECTED` y `CANCELLED`, tenencia negativa omitida y el caso Emiliano. Tests del módulo portfolio, adaptador y controlador. E2E: 400 `INVALID_USER_ID`, 404 `USER_NOT_FOUND` y respuesta 200 de Emiliano con seed sin órdenes extra.
- [x] **Documentación:** El ejemplo de Emiliano del PRD y la sección 11 del RFC coinciden con la respuesta sobre el seed del challenge. No hubo que corregir números en PRD ni RFC.

## Dependencias

TASK-02, TASK-03.
