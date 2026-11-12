import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type {
  OpenAPIObject,
  OperationObject,
  ParameterObject,
  RequestBodyObject,
  ResponseObject,
  SchemaObject,
} from '@nestjs/swagger';
import { HealthController } from '../health/health.controller.js';
import { InstrumentsController } from '../instruments/instruments.controller.js';
import { InstrumentsService } from '../instruments/instruments.service.js';
import { OrdersController } from '../orders/orders.controller.js';
import { CreateOrderService } from '../orders/create-order.service.js';
import { PortfolioController } from '../portfolio/portfolio.controller.js';
import { PortfolioService } from '../portfolio/portfolio.service.js';
import { createSwaggerDocument, setupSwagger } from './setup-swagger.js';

const MAX_EXAMPLE_SUMMARY_LENGTH = 60;

describe('OpenAPI document', () => {
  let app: INestApplication;
  let document: OpenAPIObject;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [
        PortfolioController,
        InstrumentsController,
        OrdersController,
        HealthController,
      ],
      providers: [
        { provide: PortfolioService, useValue: { getPortfolio: vi.fn() } },
        { provide: InstrumentsService, useValue: { search: vi.fn() } },
        { provide: CreateOrderService, useValue: { create: vi.fn() } },
      ],
    }).compile();
    app = module.createNestApplication();
    setupSwagger(app);
    await app.init();
    document = createSwaggerDocument(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('points the Swagger UI at schema.json', async () => {
    const page = await request(app.getHttpServer()).get('/swagger');
    expect(page.status).toBe(200);
    expect(page.text).not.toContain(
      '.swagger-ui .topbar .download-url-wrapper { display: none }',
    );

    const init = await request(app.getHttpServer()).get(
      '/swagger/swagger-ui-init.js',
    );
    expect(init.status).toBe(200);
    expect(init.text).toContain('"/schema.json"');

    const schema = await request(app.getHttpServer()).get('/schema.json');
    expect(schema.status).toBe(200);
    expect(schema.body).toMatchObject({ info: { title: 'API Cocos' } });
  });

  it('publishes the three services and the response schemas', () => {
    expect(Object.keys(document.paths).sort()).toEqual([
      '/instruments',
      '/orders',
      '/portfolio',
    ]);
    expect(document.components?.schemas).toMatchObject({
      PortfolioResponse: expect.any(Object),
      InstrumentsResponse: expect.any(Object),
      OrderResponse: expect.any(Object),
      ErrorResponse: expect.any(Object),
    });
    expect(document.servers?.[0]?.url).toBe('http://localhost:3000');
  });

  it('keeps every documented example summary within the length limit', () => {
    const summaries = collectExampleSummaries(document);
    const tooLong = summaries.filter(
      (item) => item.summary.length > MAX_EXAMPLE_SUMMARY_LENGTH,
    );
    expect(tooLong).toEqual([]);
  });

  it('documents the portfolio cases from the seed', () => {
    const operation = operationOf(document, '/portfolio', 'get');
    expect(operation.operationId).toBe('getPortfolio');
    expect(operation.tags).toEqual(['Cuenta']);
    expect(parameterExamples(operation, 'x-user-id')).toEqual([
      'emptyAccount',
      'invalidUserId',
      'unknownAccount',
      'validAccount',
    ]);
    expect(exampleValue(operation, '200', 'validAccount')).toMatchObject({
      summary: { total_value: 904784, cash_balance: 627500, currency: 'ARS' },
      positions: [
        { ticker: 'METR', quantity: 500 },
        { instrument_id: 47, ticker: 'PAMP', quantity: 40 },
      ],
    });
    expect(exampleValue(operation, '200', 'emptyAccount')).toMatchObject({
      summary: { total_value: 0, cash_balance: 0, currency: 'ARS' },
      positions: [],
    });
    expect(exampleValue(operation, '400', 'missingUserId')).toMatchObject({
      error: { code: 'INVALID_USER_ID' },
    });
    expect(exampleValue(operation, '400', 'invalidUserId')).toMatchObject({
      error: { code: 'INVALID_USER_ID' },
    });
    expect(exampleValue(operation, '404', 'unknownAccount')).toMatchObject({
      error: { code: 'USER_NOT_FOUND' },
    });
    expect(exampleValue(operation, '500', 'databaseDown')).toMatchObject({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno.' },
    });
  });

  it('documents every instruments search case', () => {
    const operation = operationOf(document, '/instruments', 'get');
    expect(operation.operationId).toBe('searchInstruments');
    expect(operation.tags).toEqual(['Instrumentos']);
    expect(queryParameterNames(operation)).toEqual(['limit', 'offset', 'q']);
    expect(parameterExamples(operation, 'q')).toEqual([
      'catalogFirstPage',
      'currencyByName',
      'currencyByTicker',
      'searchByName',
      'searchByTicker',
    ]);
    expect(parameterExamples(operation, 'limit')).toEqual([
      'defaultPage',
      'pageSizeFifty',
    ]);
    expect(parameterExamples(operation, 'offset')).toEqual([
      'catalogFirstPage',
      'secondPage',
    ]);
    expect(exampleValue(operation, '200', 'searchByTicker')).toMatchObject({
      data: [{ instrument_id: 47, ticker: 'PAMP' }],
      meta: { total: 1, limit: 10, offset: 0 },
    });
    expect(exampleValue(operation, '200', 'searchByName')).toMatchObject({
      data: [{ instrument_id: 47, ticker: 'PAMP' }],
      meta: { total: 1, limit: 10, offset: 0 },
    });
    expect(exampleValue(operation, '200', 'catalogFirstPage')).toMatchObject({
      meta: { total: 65, limit: 10, offset: 0 },
    });
    const firstPage = exampleValue(operation, '200', 'catalogFirstPage') as {
      data: { ticker: string }[];
    };
    expect(firstPage.data).toHaveLength(10);
    expect(firstPage.data.some((item) => item.ticker === 'ARS')).toBe(false);
    const pageFifty = exampleValue(operation, '200', 'pageSizeFifty') as {
      data: unknown[];
      meta: { total: number; limit: number; offset: number };
    };
    expect(pageFifty.meta).toEqual({ total: 65, limit: 50, offset: 0 });
    expect(pageFifty.data).toHaveLength(50);
    expect(
      pageFifty.data.some(
        (item) => (item as { ticker: string }).ticker === 'PATA',
      ),
    ).toBe(true);
    expect(
      pageFifty.data.some(
        (item) => (item as { ticker: string }).ticker === 'ARS',
      ),
    ).toBe(false);
    expect(exampleValue(operation, '200', 'currencyByName')).toMatchObject({
      data: [],
      meta: { total: 0 },
    });
    expect(exampleValue(operation, '200', 'currencyByTicker')).toMatchObject({
      data: [],
      meta: { total: 0 },
    });
    const secondPage = exampleValue(operation, '200', 'secondPage') as {
      data: { ticker: string }[];
      meta: { total: number; limit: number; offset: number };
    };
    expect(secondPage.data).toHaveLength(10);
    expect(secondPage.data[0]?.ticker).toBe('CAPX');
    expect(secondPage.meta).toEqual({ total: 65, limit: 10, offset: 10 });
  });

  it('documents every order case, with the PAMP market order as the default', () => {
    const operation = operationOf(document, '/orders', 'post');
    expect(operation.operationId).toBe('createOrder');
    expect(operation.tags).toEqual(['Órdenes']);
    expect(headerExample(operation, 'x-user-id')).toBe(1);
    expect(headerExample(operation, 'Idempotency-Key')).toBe(
      '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21',
    );
    expect(parameterExamples(operation, 'x-user-id')).toEqual([
      'unknownAccount',
      'validAccount',
    ]);
    expect(parameterExamples(operation, 'Idempotency-Key')).toEqual([]);
    const body = requestBody(operation);
    expect(body.example).toEqual({
      instrument_id: 47,
      side: 'BUY',
      type: 'MARKET',
      size: 1,
    });
    expect(Object.keys(body.examples ?? {}).sort()).toEqual([
      'buyLimit',
      'buyMarket',
      'emptyBody',
      'idempotencyMismatch',
      'sellLimit',
      'sellMarket',
    ]);
    expect(body.examples?.idempotencyMismatch?.value).toEqual({
      instrument_id: 47,
      side: 'SELL',
      type: 'MARKET',
      size: 1,
    });
    expect(body.examples?.emptyBody?.value).toEqual({});
    expect(body.examples?.sellLimit?.value).toEqual({
      instrument_id: 47,
      side: 'SELL',
      type: 'LIMIT',
      size: 1,
      price: 1200,
    });
    const schema = body.schema;
    expect(
      schema && !isReference(schema) ? schema.properties : {},
    ).toMatchObject({
      instrument_id: expect.any(Object),
      side: expect.any(Object),
      type: expect.any(Object),
      size: expect.any(Object),
      amount: expect.any(Object),
      price: expect.any(Object),
    });
    expect(exampleValue(operation, '201', 'buyMarket')).toMatchObject({
      status: 'FILLED',
      instrument_id: 47,
      size: 1,
    });
    expect(exampleValue(operation, '201', 'buyLimit')).toMatchObject({
      status: 'NEW',
      instrument_id: 45,
      price: 710,
    });
    expect(exampleValue(operation, '201', 'sellMarket')).toMatchObject({
      status: 'REJECTED',
      size: 1000,
    });
    expect(exampleValue(operation, '201', 'sellLimit')).toMatchObject({
      status: 'NEW',
      instrument_id: 47,
      price: 1200,
    });
    expect(
      exampleValue(operation, '400', 'invalidIdempotencyKey'),
    ).toMatchObject({ error: { code: 'INVALID_IDEMPOTENCY_KEY' } });
    expect(exampleValue(operation, '400', 'idempotencyMismatch')).toMatchObject(
      {
        error: { code: 'IDEMPOTENCY_KEY_MISMATCH' },
      },
    );
    expect(exampleValue(operation, '400', 'emptyBody')).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
    });
    expect(exampleValue(operation, '400', 'invalidOrderSide')).toMatchObject({
      error: { code: 'INVALID_ORDER_SIDE' },
    });
    expect(exampleValue(operation, '400', 'invalidOrderType')).toMatchObject({
      error: { code: 'INVALID_ORDER_TYPE' },
    });
  });
});

function collectExampleSummaries(
  document: OpenAPIObject,
): { location: string; name: string; summary: string }[] {
  const out: { location: string; name: string; summary: string }[] = [];

  const pushExamples = (
    examples: Record<string, { summary?: string }> | undefined,
    location: string,
  ) => {
    if (examples === undefined) {
      return;
    }
    for (const [name, example] of Object.entries(examples)) {
      const summary = example.summary;
      if (typeof summary === 'string') {
        out.push({ location, name, summary });
      }
    }
  };

  for (const [path, pathItem] of Object.entries(document.paths)) {
    for (const method of ['get', 'post'] as const) {
      const operation = pathItem?.[method];
      if (operation === undefined) {
        continue;
      }
      const base = `${method.toUpperCase()} ${path}`;
      for (const parameter of operation.parameters ?? []) {
        if (isReference(parameter)) {
          continue;
        }
        pushExamples(
          parameter.examples as Record<string, { summary?: string }>,
          `${base} parameter ${parameter.name}`,
        );
      }
      const requestBody = operation.requestBody;
      if (requestBody !== undefined && !isReference(requestBody)) {
        const media = (requestBody as RequestBodyObject).content[
          'application/json'
        ];
        pushExamples(
          media?.examples as Record<string, { summary?: string }>,
          `${base} requestBody`,
        );
      }
      for (const [status, response] of Object.entries(operation.responses)) {
        if (isReference(response)) {
          continue;
        }
        const media = (response as ResponseObject).content?.[
          'application/json'
        ];
        pushExamples(
          media?.examples as Record<string, { summary?: string }>,
          `${base} response ${status}`,
        );
      }
    }
  }

  return out;
}

function operationOf(
  document: OpenAPIObject,
  path: string,
  method: 'get' | 'post',
): OperationObject {
  const operation = document.paths[path]?.[method];
  if (operation === undefined) {
    throw new Error(`Missing ${method} ${path}`);
  }
  return operation;
}

function queryParameterNames(operation: OperationObject): string[] {
  return (operation.parameters ?? [])
    .filter(
      (parameter): parameter is ParameterObject => !isReference(parameter),
    )
    .filter((parameter) => parameter.in === 'query')
    .map((parameter) => parameter.name)
    .sort();
}

function parameterExamples(operation: OperationObject, name: string): string[] {
  const parameter = (operation.parameters ?? []).find(
    (item): item is ParameterObject => !isReference(item) && item.name === name,
  );
  return Object.keys(parameter?.examples ?? {}).sort();
}

function headerExample(operation: OperationObject, name: string): unknown {
  const parameter = (operation.parameters ?? []).find(
    (item): item is ParameterObject => !isReference(item) && item.name === name,
  );
  return parameter?.example ?? parameter?.schema?.example;
}

function exampleValue(
  operation: OperationObject,
  status: string,
  name: string,
): unknown {
  const response = operation.responses[status];
  if (response === undefined || isReference(response)) {
    throw new Error(`Missing response ${status}`);
  }
  const media = (response as ResponseObject).content?.['application/json'];
  return media?.examples?.[name]?.value;
}

function requestBody(operation: OperationObject): {
  example: unknown;
  examples: RequestBodyObject['content'][string]['examples'];
  schema: SchemaObject | undefined;
} {
  const body = operation.requestBody;
  if (body === undefined || isReference(body)) {
    throw new Error('Missing request body');
  }
  const media = (body as RequestBodyObject).content['application/json'];
  const schema = media?.schema;
  return {
    example: media?.example,
    examples: media?.examples,
    schema: schema !== undefined && !isReference(schema) ? schema : undefined,
  };
}

function isReference(value: object): value is { $ref: string } {
  return '$ref' in value;
}
