# chore: preparar el proyecto NestJS con Docker, lint y reglas de Cursor

## 1. Contexto y objetivo

- **Propósito:** Dejar un proceso NestJS que arranca en local, se construye con Docker y rechaza commits fuera de las convenciones del RFC.
- **Alcance (In-Scope):** Aplicación NestJS en TypeScript, scripts de desarrollo, build y test, `.env.example` con `DATABASE_URL`, Dockerfile, compose de la API con PostgreSQL, ESLint, Prettier, Husky, lint-staged, Commitlint y reglas de Cursor en `.cursor/rules`.
- **Fuera de alcance (Out-of-Scope):** Reglas de cuenta, búsqueda u órdenes. Migración del esquema. Swagger. OpenTelemetry.

## 2. Requisitos técnicos y restricciones

- **Stack / Tecnologías:** Node.js en la versión LTS activa al implementar. NestJS. TypeScript en modo estricto. ESLint y Prettier con la configuración base de TypeScript para NestJS. Husky y lint-staged. `@commitlint/cli` y `@commitlint/config-conventional`. Docker.
- **Restricciones estrictas:**
  - Sin asunciones: las versiones exactas de Node, NestJS, TypeORM y de los paquetes de lint se verifican en el registro al implementar. No se fijan de memoria.
  - El hook `pre-commit` corre ESLint y Prettier solo sobre los archivos modificados.
  - El hook `commit-msg` exige Conventional Commits. Un mensaje válido tiene la forma `feat(api): add dockerfile`.
  - Los secretos no se versionan. `.env.example` documenta `DATABASE_URL` sin un valor real.
  - Las reglas de `.cursor/rules` describen el stack, el monolito modular, el manejo de excepciones y la nomenclatura de archivos, clases, DTOs y entidades. `.cursor/rules` es el equivalente actual de `.cursorrules`.

## 3. Archivos y recursos de referencia

- **Archivos a modificar/crear:** `package.json`, `tsconfig.json`, `nest-cli.json`, `src/main.ts`, `src/app.module.ts`, `.env.example`, `.gitignore`, `Dockerfile`, `docker-compose.yml`, `.prettierrc`, configuración de ESLint, `.husky/pre-commit`, `.husky/commit-msg`, `commitlint.config.js`, `.cursor/rules/`
- **Firma / Contrato propuesto:** Este ticket no expone un contrato HTTP. La variable de entorno obligatoria es `DATABASE_URL`.

Fuente de producto: [docs/prd.md](../prd.md). Fuente técnica: sección 10 de [docs/rfc.md](../rfc.md), requerimiento 24.

## 4. Instrucciones paso a paso

1. **Plan de cambios (Preview):** Antes de escribir código, resumir el árbol de archivos, los scripts y qué va a rechazar cada hook.
2. **Implementación:** Crear el proyecto NestJS. Activar TypeScript estricto. Agregar el formateo, los hooks y las reglas de Cursor. Escribir el Dockerfile y el compose con PostgreSQL. Confirmar que el proceso arranca apuntando a `DATABASE_URL`.
3. **Documentación:** Si cambia un script o una variable de entorno respecto del RFC, anotarlo en `docs/rfc.md` en la sección 10.

## 5. Resultados esperados y verificación

- [x] **Comprobaciones manuales:** `npm run build` y el arranque local terminan sin error cuando `DATABASE_URL` está definida. Sin esa variable el proceso termina. La imagen Docker no se construyó: `docker` no está en el PATH de esta máquina. `Dockerfile` y `docker-compose.yml` quedaron escritos.
- [x] **Escenarios de test (Unitarios / E2E):** Commitlint rechaza `bad message` y acepta `feat(api): add dockerfile`. La prueba unitaria de `readDatabaseUrl` pasa. No hay prueba de negocio en este ticket.
- [x] **Documentación:** `.cursor/rules/architecture.mdc` describe las convenciones del monolito modular. `.env.example` lista `DATABASE_URL`.

## Dependencias

Ninguna.
