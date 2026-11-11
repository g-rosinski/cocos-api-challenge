# chore: conectar PostgreSQL con TypeORM y aplicar la migración aditiva

## 1. Contexto y objetivo

- **Propósito:** Usar el esquema y el seed del challenge, y sumar solo los índices y la tabla de idempotencia definidos en el RFC.
- **Alcance (In-Scope):** Carga del SQL del challenge en la base local. Conexión TypeORM por `DATABASE_URL`. `synchronize` apagado. Migración `up` y `down` de la sección 5 del RFC. Mapeo de columnas en minúsculas.
- **Fuera de alcance (Out-of-Scope):** Recrear `users`, `instruments`, `orders` o `marketdata` desde entidades. Redis. Lógica de los tres servicios.

## 2. Requisitos técnicos y restricciones

- **Stack / Tecnologías:** `@nestjs/typeorm` y TypeORM. PostgreSQL. Extensión `pg_trgm`.
- **Restricciones estrictas:**
  - Sin asunciones: el archivo de seed del challenge se copia o se referencia de forma explícita al implementar. Su ruta en este repositorio queda pendiente de verificación porque hoy vive fuera de `docs/`.
  - El `CREATE TABLE` original no cita identificadores. PostgreSQL guarda `instrumentid` y `userid`. Los índices usan esos nombres.
  - `up` crea `pg_trgm`, los índices `instruments_ticker_trgm`, `instruments_name_trgm`, `orders_instrument_type_idx`, `orders_user_status_idx`, `marketdata_instrument_date_idx` y la tabla `order_idempotency_keys` tal como está escrita en el RFC.
  - `down` borra la tabla y los índices. No desinstala `pg_trgm`.
  - El índice GIN y `CREATE EXTENSION` se escriben a mano. No se acepta el SQL que genere TypeORM si omite esa extensión.
  - En el contenedor, `migration:run` corre antes de servir tráfico.

## 3. Archivos y recursos de referencia

- **Archivos a modificar/crear:** módulo de TypeORM, `src/database/migrations/` con la migración `up` y `down`, script de carga del seed, `docker-compose.yml` si el arranque debe esperar la base.
- **Firma / Contrato propuesto:**

```typescript
type DatabaseConfig = {
  url: string;
  synchronize: false;
};
```

Fuente técnica: sección 5 de [docs/rfc.md](../rfc.md).

## 4. Instrucciones paso a paso

1. **Plan de cambios (Preview):** Mostrar el SQL de `up` y `down` junto al de la sección 5 del RFC, y la lista de archivos, antes de escribir la migración.
2. **Implementación:** Cargar el seed. Registrar el `DataSource` con `synchronize: false`. Escribir la migración a mano. Ejecutarla contra la base local y revertirla una vez.
3. **Documentación:** Si el nombre de una columna real difiere del RFC, corregir el RFC y la migración juntos. El `CREATE TABLE` de idempotencia vive solo en esa migración.

## 5. Resultados esperados y verificación

- [ ] **Comprobaciones manuales:** Sobre el seed, `migration:run` crea la extensión, los cinco índices y `order_idempotency_keys`. `migration:revert` borra la tabla y los índices, y deja `pg_trgm`.
- [ ] **Escenarios de test (Unitarios / E2E):** No hay prueba de negocio. La verificación es correr la migración y su reverso contra PostgreSQL local.
- [ ] **Documentación:** La sección 5 del RFC sigue siendo la única copia del DDL.

## Dependencias

TASK-01.
