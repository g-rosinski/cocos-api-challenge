# feat: publicar Swagger y schema.json con ejemplos del seed

## 1. Contexto y objetivo

- **Propósito:** Quien evalúa la API descarga el `schema.json`, lo importa en Postman y ejecuta los ejemplos contra la base de ejemplo.
- **Alcance (In-Scope):** Swagger de los tres servicios y un `schema.json` descargable, con ejemplos de la cuenta 1, de `q=pamp` y de una orden sobre PAMP. Cada operación incluye los casos de la sección 12 del RFC. Los curls de esos casos quedan en `docs/curls.md`.
- **Fuera de alcance (Out-of-Scope):** Una colección versionada de Postman aparte del schema.

## 2. Requisitos técnicos y restricciones

- **Stack / Tecnologías:** El paquete de Swagger de NestJS. La versión se verifica al implementar. No se elige otro generador de OpenAPI.
- **Restricciones estrictas:**
  - Sin asunciones: no se documenta un cuarto servicio.
  - Los ejemplos usan datos del seed: `x-user-id: 1`, `instrument_id` 47 y un `Idempotency-Key` que sea un UUID válido.
  - Los cuerpos de ejemplo están en snake_case y coinciden con los contratos de TASK-04, TASK-05 y TASK-06.

## 3. Archivos y recursos de referencia

- **Archivos a modificar/crear:** configuración de Swagger en `src/main.ts`, decoradores de los tres controladores y de sus DTOs, y `docs/curls.md`.
- **Firma / Contrato propuesto:** No hay un tipo nuevo. Se documentan `PortfolioResponse`, `InstrumentsResponse` y `OrderResponse`.

Fuente técnica: requerimiento 22 y sección 11 de [docs/rfc.md](../rfc.md).

## 4. Instrucciones paso a paso

1. **Plan de cambios (Preview):** Indicar la ruta del `schema.json` y los tres ejemplos antes de anotar los controladores.
2. **Implementación:** Registrar Swagger. Marcar headers, query y cuerpos. Cargar los ejemplos del seed.
3. **Documentación:** Escribir en el RFC la ruta final del `schema.json` si no queda explícita al implementar.

## 5. Resultados esperados y verificación

- [ ] **Comprobaciones manuales:** El schema se importa en Postman. Los ejemplos de la cuenta 1, de `pamp` y de la orden sobre PAMP se ejecutan contra el seed sin reescribir cuerpo ni headers.
- [ ] **Escenarios de test (Unitarios / E2E):** No reemplaza los escenarios E2E del RFC. La comprobación es la importación y una ejecución de cada ejemplo.
- [x] **Documentación:** La sección 11 del RFC menciona `/swagger` y `/schema.json`. Los curls están en `docs/curls.md`.

## Dependencias

TASK-04, TASK-05, TASK-06.
