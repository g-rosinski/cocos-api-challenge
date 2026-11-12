import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiHeader,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
  type SchemaObject,
} from '@nestjs/swagger';
import {
  databaseDownExample,
  idempotencyMismatchExample,
  invalidIdempotencyKeyExample,
  invalidOrderBodyExample,
  invalidOrderSideExample,
  invalidOrderTypeExample,
  missingUserIdExample,
  unknownAccountExample,
} from '../openapi/error-response.schema.js';
import type { CreateOrderBody } from './create-order-body.js';
import { ORDER_SIDES, ORDER_TYPES } from './domain/order.types.js';
import type { OrderResponse } from './order-response.types.js';

export const BUY_MARKET_IDEMPOTENCY_KEY =
  '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21';
export const BUY_LIMIT_IDEMPOTENCY_KEY = '7a2b3c4d-5e6f-4789-a012-b3c4d5e6f789';
export const SELL_MARKET_IDEMPOTENCY_KEY =
  '8b3c4d5e-6f70-4891-b123-c4d5e6f70891';
export const SELL_LIMIT_IDEMPOTENCY_KEY =
  '9d4e5f6a-7b80-4901-c234-e5f6a708192b';

export const orderResponseSchema: SchemaObject = {
  type: 'object',
  required: [
    'order_id',
    'user_id',
    'instrument_id',
    'side',
    'type',
    'size',
    'price',
    'status',
    'datetime',
  ],
  properties: {
    order_id: { type: 'integer' },
    user_id: { type: 'integer', example: 1 },
    instrument_id: { type: 'integer', example: 47 },
    side: { type: 'string', enum: [...ORDER_SIDES] },
    type: { type: 'string', enum: [...ORDER_TYPES] },
    size: { type: 'integer' },
    price: { type: 'number' },
    status: { type: 'string', enum: ['FILLED', 'NEW', 'REJECTED'] },
    datetime: { type: 'string', example: '2026-11-10T13:06:00' },
  },
};

export const buyMarketOrderBody = {
  instrument_id: 47,
  side: 'BUY',
  type: 'MARKET',
  size: 1,
} satisfies CreateOrderBody;

export const buyLimitOrderBody = {
  instrument_id: 45,
  side: 'BUY',
  type: 'LIMIT',
  size: 1,
  price: 710,
} satisfies CreateOrderBody;

export const sellMarketOrderBody = {
  instrument_id: 47,
  side: 'SELL',
  type: 'MARKET',
  size: 1000,
} satisfies CreateOrderBody;

export const sellLimitOrderBody = {
  instrument_id: 47,
  side: 'SELL',
  type: 'LIMIT',
  size: 1,
  price: 1200,
} satisfies CreateOrderBody;

export const idempotencyMismatchOrderBody = {
  instrument_id: 47,
  side: 'SELL',
  type: 'MARKET',
  size: 1,
} satisfies CreateOrderBody;

export const emptyOrderBody: Record<string, never> = {};

const sampleDatetime = '2026-11-10T13:06:00';

export const buyMarketOrderExample: OrderResponse = {
  order_id: 14,
  user_id: 1,
  instrument_id: 47,
  side: 'BUY',
  type: 'MARKET',
  size: 1,
  price: 925.85,
  status: 'FILLED',
  datetime: sampleDatetime,
};

export const buyLimitOrderExample: OrderResponse = {
  order_id: 15,
  user_id: 1,
  instrument_id: 45,
  side: 'BUY',
  type: 'LIMIT',
  size: 1,
  price: 710,
  status: 'NEW',
  datetime: sampleDatetime,
};

export const sellMarketOrderExample: OrderResponse = {
  order_id: 16,
  user_id: 1,
  instrument_id: 47,
  side: 'SELL',
  type: 'MARKET',
  size: 1000,
  price: 925.85,
  status: 'REJECTED',
  datetime: sampleDatetime,
};

export const sellLimitOrderExample: OrderResponse = {
  order_id: 17,
  user_id: 1,
  instrument_id: 47,
  side: 'SELL',
  type: 'LIMIT',
  size: 1,
  price: 1200,
  status: 'NEW',
  datetime: sampleDatetime,
};

const errorSchema = { $ref: getSchemaPath('ErrorResponse') };

export function ApiCreateOrder(): MethodDecorator {
  return applyDecorators(
    ApiTags('Órdenes'),
    ApiOperation({
      summary: 'Enviar una orden',
      description:
        'Crea una orden para la cuenta de x-user-id. Mercado se ejecuta al último cierre. Límite queda abierta al precio enviado. Si no alcanzan los pesos o las acciones, la orden se guarda rechazada. Repetir la misma clave y el mismo cuerpo devuelve la misma respuesta. La misma clave con otro cuerpo responde 400. order_id y datetime del ejemplo son ilustrativos.',
    }),
    ApiHeader({
      name: 'x-user-id',
      description:
        'Cuenta que envía la orden. Entero existente en users. Si falta o no es un entero, la respuesta es 400.',
      required: true,
      schema: { type: 'integer' },
      example: 1,
      examples: {
        validAccount: { summary: 'Orden para cuenta válida', value: 1 },
        unknownAccount: {
          summary: 'Orden para cuenta inexistente',
          value: 999,
        },
      },
    }),
    ApiHeader({
      name: 'Idempotency-Key',
      description:
        'UUID de la orden. La misma clave y el mismo cuerpo repiten la respuesta. Un valor que no es UUID responde 400.',
      required: true,
      schema: { type: 'string', format: 'uuid' },
      example: BUY_MARKET_IDEMPOTENCY_KEY,
    }),
    ApiBody({
      required: true,
      description:
        'Cuerpo en snake_case. Mercado no lleva precio. Límite exige precio. size y amount no van juntos. Cada ejemplo usa un UUID distinto en la descripción.',
      examples: {
        buyMarket: {
          summary: 'Compra a mercado',
          description: `Idempotency-Key ${BUY_MARKET_IDEMPOTENCY_KEY}.`,
          value: buyMarketOrderBody,
        },
        buyLimit: {
          summary: 'Compra tipo Limit',
          description: `Idempotency-Key ${BUY_LIMIT_IDEMPOTENCY_KEY}.`,
          value: buyLimitOrderBody,
        },
        sellMarket: {
          summary: 'Venta a mercado sin tenencia',
          description: `Idempotency-Key ${SELL_MARKET_IDEMPOTENCY_KEY}. Hay 40 PAMP disponibles.`,
          value: sellMarketOrderBody,
        },
        sellLimit: {
          summary: 'Venta tipo Limit',
          description: `Idempotency-Key ${SELL_LIMIT_IDEMPOTENCY_KEY}.`,
          value: sellLimitOrderBody,
        },
        idempotencyMismatch: {
          summary: 'Misma clave, pedido distinto',
          description: `Reutiliza ${BUY_MARKET_IDEMPOTENCY_KEY} después de la compra a mercado.`,
          value: idempotencyMismatchOrderBody,
        },
        emptyBody: {
          summary: 'Pedido sin datos de orden',
          description: 'Cuerpo vacío con un UUID nuevo.',
          value: emptyOrderBody,
        },
      },
    }),
    ApiCreatedResponse({
      description:
        'Orden guardada. order_id y datetime dependen del alta real.',
      schema: { $ref: getSchemaPath('OrderResponse') },
      examples: {
        buyMarket: {
          summary: 'Compra a mercado',
          value: buyMarketOrderExample,
        },
        buyLimit: {
          summary: 'Compra tipo Limit',
          value: buyLimitOrderExample,
        },
        sellMarket: {
          summary: 'Venta a mercado sin tenencia',
          value: sellMarketOrderExample,
        },
        sellLimit: {
          summary: 'Venta tipo Limit',
          value: sellLimitOrderExample,
        },
      },
    }),
    ApiBadRequestResponse({
      description:
        'Header de cuenta inválido, clave de idempotencia inválida, clave reutilizada con otro cuerpo, o cuerpo que no cumple el contrato.',
      schema: errorSchema,
      examples: {
        missingUserId: missingUserIdExample,
        invalidIdempotencyKey: invalidIdempotencyKeyExample,
        idempotencyMismatch: idempotencyMismatchExample,
        emptyBody: invalidOrderBodyExample,
        invalidOrderSide: invalidOrderSideExample,
        invalidOrderType: invalidOrderTypeExample,
      },
    }),
    ApiNotFoundResponse({
      description: 'La cuenta no existe.',
      schema: errorSchema,
      examples: { unknownAccount: unknownAccountExample },
    }),
    ApiInternalServerErrorResponse({
      description:
        'La base no responde. El cuerpo no describe la falla. Este caso no se ejecuta contra el seed.',
      schema: errorSchema,
      examples: { databaseDown: databaseDownExample },
    }),
  );
}
