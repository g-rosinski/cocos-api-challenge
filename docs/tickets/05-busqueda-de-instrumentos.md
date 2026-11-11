# feat: buscar instrumentos por ticker o nombre con paginado

## 1. Contexto y objetivo

- **Propósito:** `GET /instruments` devuelve una página de activos parecidos al texto buscado, sin incluir la moneda.
- **Alcance (In-Scope):** Búsqueda parcial sin distinguir mayúsculas. Paginado. Puerto de búsqueda implementado con PostgreSQL.
- **Fuera de alcance (Out-of-Scope):** Redis. Exigir `x-user-id` en esta ruta.

## 2. Requisitos técnicos y restricciones

- **Stack / Tecnologías:** NestJS. TypeORM. PostgreSQL con los índices GIN de `pg_trgm` creados en TASK-02.
- **Restricciones estrictas:**
  - Sin asunciones: no se agrega un cliente de Redis en este ticket.
  - `limit` por defecto es 10. `offset` por defecto es 0. El máximo de `limit` no está en el RFC y queda pendiente de verificación antes de imponer uno.
  - Se excluye `type = MONEDA`.
  - El orden es `ticker` ascendente.
  - El caso de uso depende de un puerto. El adaptador de PostgreSQL es la única implementación.

## 3. Archivos y recursos de referencia

- **Archivos a modificar/crear:** `src/instruments/instruments.module.ts`, `src/instruments/instruments.controller.ts`, `src/instruments/instruments.service.ts`, `src/instruments/instrument-search.port.ts`, adaptador TypeORM.
- **Firma / Contrato propuesto:**

```typescript
type InstrumentItem = {
  instrument_id: number;
  ticker: string;
  name: string;
  type: string;
};

type InstrumentsResponse = {
  data: InstrumentItem[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
};

type InstrumentSearch = {
  search(input: {
    query: string;
    limit: number;
    offset: number;
  }): Promise<InstrumentsResponse>;
};
```

Fuente de producto: historia "Buscar un activo" de [docs/prd.md](../prd.md). Fuente técnica: sección 11 de [docs/rfc.md](../rfc.md).

## 4. Instrucciones paso a paso

1. **Plan de cambios (Preview):** Mostrar el puerto, el adaptador y la forma de `data` y `meta` antes de escribir código.
2. **Implementación:** Crear el módulo. Filtrar por ticker o nombre. Excluir la moneda. Paginar. No leer `x-user-id`.
3. **Documentación:** Si se fija un `limit` máximo, escribirlo en el RFC antes de dejarlo en el código.

## 5. Resultados esperados y verificación

- [ ] **Comprobaciones manuales:** `q=pamp` devuelve Pampa Holding y `meta.total` 1. Sin `q`, la primera página trae 10 activos, `meta.total` es 65 y ninguno es `ARS`. `q=pesos` y `q=ARS` devuelven `data` vacío y `total` 0. `limit=10&offset=10` devuelve la segunda página y el mismo `total`.
- [ ] **Escenarios de test (Unitarios / E2E):** Prueba unitaria del servicio con un puerto falso: texto vacío, coincidencia parcial y exclusión de `MONEDA`.
- [ ] **Documentación:** El contrato de la sección 11 del RFC no cambia.

## Dependencias

TASK-02, TASK-03.
