import { ValidationException } from '../common/errors/validation.exception.js';
import {
  createOrderBodySchema,
  createOrderValidationPipe,
} from './create-order-body.js';

describe('createOrderBodySchema', () => {
  it('accepts a market order with size and a limit order with price', () => {
    expect(
      createOrderBodySchema.parse({
        instrument_id: 47,
        side: 'BUY',
        type: 'MARKET',
        size: 1,
      }),
    ).toEqual({
      instrument_id: 47,
      side: 'BUY',
      type: 'MARKET',
      size: 1,
    });
    expect(
      createOrderBodySchema.parse({
        instrument_id: 45,
        side: 'BUY',
        type: 'LIMIT',
        amount: 1000,
        price: 710,
      }),
    ).toEqual({
      instrument_id: 45,
      side: 'BUY',
      type: 'LIMIT',
      amount: 1000,
      price: 710,
    });
  });

  it.each([
    {},
    { instrument_id: 47, side: 'BUY', type: 'MARKET' },
    { instrument_id: 47, side: 'BUY', type: 'MARKET', size: 1, amount: 10 },
    { instrument_id: 47, side: 'BUY', type: 'MARKET', size: 1, price: 10 },
    { instrument_id: 47, side: 'BUY', type: 'LIMIT', size: 1 },
    { instrument_id: 47, side: 'BUY', type: 'MARKET', size: 1.5 },
    { instrument_id: 47, side: 'BUY', type: 'MARKET', size: 0 },
    { instrument_id: 47, side: 'HOLD', type: 'MARKET', size: 1 },
    { instrument_id: 47, side: 'BUY', type: 'STOP', size: 1 },
    { instrument_id: '47', side: 'BUY', type: 'MARKET', size: 1 },
    { instrument_id: 47, side: 'BUY', type: 'LIMIT', size: 1, price: 710.123 },
    {
      instrument_id: 47,
      side: 'BUY',
      type: 'MARKET',
      size: 1,
      extra: true,
    },
  ])('rejects an invalid body %j', (body) => {
    expect(createOrderBodySchema.safeParse(body).success).toBe(false);
  });
});

describe('createOrderValidationPipe', () => {
  it('throws ValidationException with the order message', async () => {
    await expect(
      createOrderValidationPipe.transform(
        {},
        {
          type: 'body',
          data: undefined,
          metatype: Object,
          schema: createOrderBodySchema,
        },
      ),
    ).rejects.toMatchObject({
      name: ValidationException.name,
      message: 'El cuerpo de la orden es inválido.',
    });
  });
});
