import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/filters/api-exception.filter.js';
import { CanonicalLogInterceptor } from '../src/common/logging/canonical-log.interceptor.js';

describe('AppModule', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.DATABASE_URL =
      'postgres://postgres:123456@localhost:5432/neondb';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(app.get(ApiExceptionFilter));
    app.useGlobalInterceptors(app.get(CanonicalLogInterceptor));
    await app.init();
  });

  it('boots when DATABASE_URL is set', () => {
    expect(app).toBeDefined();
  });

  it('GET /health returns ok without correlation headers', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(response.body).toEqual({ status: 'ok' });
    expect(response.headers['x-correlation-id']).toBeUndefined();
  });

  it('GET /portfolio without x-user-id returns INVALID_USER_ID', async () => {
    const response = await request(app.getHttpServer())
      .get('/portfolio')
      .expect(400);

    expect(response.body.error.code).toBe('INVALID_USER_ID');
    expect(response.body.error.message).toBe(
      'El header x-user-id es obligatorio y tiene que ser un entero.',
    );
    expect(typeof response.body.error.correlation_id).toBe('string');
    expect(response.headers['x-correlation-id']).toEqual(
      response.body.error.correlation_id,
    );
  });

  it('GET /portfolio with a missing user returns USER_NOT_FOUND', async () => {
    const response = await request(app.getHttpServer())
      .get('/portfolio')
      .set('x-user-id', '999')
      .expect(404);

    expect(response.body.error.code).toBe('USER_NOT_FOUND');
    expect(response.body.error.message).toBe('La cuenta no existe.');
    expect(typeof response.body.error.correlation_id).toBe('string');
  });

  afterEach(async () => {
    await app.close();
  });
});
