# cocos-api-challenge

API de consulta de cuenta y envío de órdenes. El producto está en [docs/prd.md](docs/prd.md), la implementación en [docs/rfc.md](docs/rfc.md) y el plan en [docs/tickets/README.md](docs/tickets/README.md).

Node.js 26, la LTS activa. La aplicación exige `DATABASE_URL`.

```bash
cp .env.example .env
# Completar DATABASE_URL en .env
npm run start:dev
```

Nest carga variables desde `.env` en la raíz del proyecto (vía `@nestjs/config`).

Docker levanta la API y PostgreSQL:

```bash
docker compose up --build
```
