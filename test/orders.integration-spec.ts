import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/filters/api-exception.filter.js';
import { CanonicalLogInterceptor } from '../src/common/logging/canonical-log.interceptor.js';
import type { OrderResponse } from '../src/orders/order-response.types.js';
import type { PortfolioResponse } from '../src/portfolio/portfolio-response.types.js';

const MARKET_BUY_KEY = '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21';
const LIMIT_BUY_KEY = '7a2b3c4d-5e6f-4789-a012-b3c4d5e6f789';
const REJECT_SELL_KEY = '8b3c4d5e-6f70-4891-b123-c4d5e6f70891';

describe.sequential('POST /orders against PostgreSQL', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let baselineOrderId: number;
  let filledMarketOrder: OrderResponse;

  async function loadPortfolio(): Promise<PortfolioResponse> {
    const response = await request(app.getHttpServer())
      .get('/portfolio')
      .set('x-user-id', '1')
      .expect(200);
    return response.body as PortfolioResponse;
  }

  async function countOrdersAfterBaseline(): Promise<number> {
    const rows: { count: number | string }[] = await dataSource.query(
      'SELECT COUNT(*)::int AS count FROM orders WHERE id > $1',
      [baselineOrderId],
    );
    const row = rows[0];
    if (row === undefined) {
      return 0;
    }
    return Number(row.count);
  }

  beforeAll(async () => {
    process.env.DATABASE_URL ??=
      'postgres://postgres:123456@localhost:5432/neondb';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(app.get(ApiExceptionFilter));
    app.useGlobalInterceptors(app.get(CanonicalLogInterceptor));
    await app.init();

    dataSource = app.get(DataSource);
    const rows: { max_id: number | string }[] = await dataSource.query(
      'SELECT COALESCE(MAX(id), 0)::int AS max_id FROM orders',
    );
    const row = rows[0];
    baselineOrderId = row === undefined ? 0 : Number(row.max_id);
    await dataSource.query(
      'DELETE FROM order_idempotency_keys WHERE order_id > $1',
      [baselineOrderId],
    );
    await dataSource.query('DELETE FROM orders WHERE id > $1', [
      baselineOrderId,
    ]);
    await dataSource.query(
      `DELETE FROM order_idempotency_keys
       WHERE user_id = 1
         AND idempotency_key = ANY($1::uuid[])`,
      [[MARKET_BUY_KEY, LIMIT_BUY_KEY, REJECT_SELL_KEY]],
    );
  });

  afterAll(async () => {
    await dataSource.query(
      'DELETE FROM order_idempotency_keys WHERE order_id > $1',
      [baselineOrderId],
    );
    await dataSource.query('DELETE FROM orders WHERE id > $1', [
      baselineOrderId,
    ]);
    await app.close();
  });

  it('01 fills a market buy for PAMP', async () => {
    const before = await loadPortfolio();
    const response = await request(app.getHttpServer())
      .post('/orders')
      .set('x-user-id', '1')
      .set('Idempotency-Key', MARKET_BUY_KEY)
      .send({
        instrument_id: 47,
        side: 'BUY',
        type: 'MARKET',
        size: 1,
      })
      .expect(201);

    filledMarketOrder = response.body as OrderResponse;
    expect(filledMarketOrder).toMatchObject({
      user_id: 1,
      instrument_id: 47,
      side: 'BUY',
      type: 'MARKET',
      size: 1,
      price: 925.85,
      status: 'FILLED',
    });
    expect(await countOrdersAfterBaseline()).toBe(1);

    const after = await loadPortfolio();
    expect(after.summary.cash_balance).toBe(
      before.summary.cash_balance - 925.85,
    );
    const pampBefore =
      before.positions.find((position) => position.ticker === 'PAMP')
        ?.quantity ?? 0;
    const pampAfter = after.positions.find(
      (position) => position.ticker === 'PAMP',
    )?.quantity;
    expect(pampAfter).toBe(pampBefore + 1);
  });

  it('02 opens a limit buy for LOMA and reserves cash', async () => {
    const before = await loadPortfolio();

    const response = await request(app.getHttpServer())
      .post('/orders')
      .set('x-user-id', '1')
      .set('Idempotency-Key', LIMIT_BUY_KEY)
      .send({
        instrument_id: 45,
        side: 'BUY',
        type: 'LIMIT',
        size: 1,
        price: 710,
      })
      .expect(201);

    expect(response.body).toMatchObject({
      user_id: 1,
      instrument_id: 45,
      side: 'BUY',
      type: 'LIMIT',
      size: 1,
      price: 710,
      status: 'NEW',
    });

    const after = await loadPortfolio();
    expect(after.summary.total_value).toBe(before.summary.total_value);
    expect(after.summary.cash_balance).toBe(before.summary.cash_balance - 710);
    expect(after.positions.some((position) => position.ticker === 'LOMA')).toBe(
      false,
    );
  });

  it('03 stores a rejected sell when shares are insufficient', async () => {
    const before = await loadPortfolio();

    const response = await request(app.getHttpServer())
      .post('/orders')
      .set('x-user-id', '1')
      .set('Idempotency-Key', REJECT_SELL_KEY)
      .send({
        instrument_id: 47,
        side: 'SELL',
        type: 'MARKET',
        size: 1000,
      })
      .expect(201);

    expect(response.body).toMatchObject({
      instrument_id: 47,
      side: 'SELL',
      type: 'MARKET',
      size: 1000,
      price: 925.85,
      status: 'REJECTED',
    });

    const after = await loadPortfolio();
    expect(after).toEqual(before);
  });

  it('04 replays a market buy with the same idempotency key and hash', async () => {
    const replay = await request(app.getHttpServer())
      .post('/orders')
      .set('x-user-id', '1')
      .set('Idempotency-Key', MARKET_BUY_KEY)
      .send({
        instrument_id: 47,
        side: 'BUY',
        type: 'MARKET',
        size: 1,
      })
      .expect(201);

    expect(replay.body).toEqual(filledMarketOrder);
    expect(await countOrdersAfterBaseline()).toBe(3);
  });

  it('05 rejects a mismatched payload for an existing idempotency key', async () => {
    const response = await request(app.getHttpServer())
      .post('/orders')
      .set('x-user-id', '1')
      .set('Idempotency-Key', MARKET_BUY_KEY)
      .send({
        instrument_id: 47,
        side: 'SELL',
        type: 'MARKET',
        size: 1,
      })
      .expect(400);

    expect(response.body.error.code).toBe('IDEMPOTENCY_KEY_MISMATCH');
    expect(response.body.error.message).toBe(
      'La clave de idempotencia ya fue utilizada con otros parámetros.',
    );
    expect(typeof response.body.error.correlation_id).toBe('string');
    expect(await countOrdersAfterBaseline()).toBe(3);
  });
});
