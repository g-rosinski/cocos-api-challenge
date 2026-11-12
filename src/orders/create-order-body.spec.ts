import { InvalidOrderSideException } from '@/common/errors/invalid-order-side.exception';
import { InvalidOrderTypeException } from '@/common/errors/invalid-order-type.exception';
import { ValidationException } from '@/common/errors/validation.exception';
import {
  createOrderBodySchema,
  createOrderValidationPipe,
  resolveCreateOrderBodyException,
} from '@/orders/create-order-body';

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

describe('resolveCreateOrderBodyException', () => {
  it('maps an invalid side to InvalidOrderSideException', () => {
    const { error } = createOrderBodySchema.safeParse({
      instrument_id: 47,
      side: 'HOLD',
      type: 'MARKET',
      size: 1,
    });
    expect(error).toBeDefined();
    const exception = resolveCreateOrderBodyException(error!.issues, {
      instrument_id: 47,
      side: 'HOLD',
      type: 'MARKET',
      size: 1,
    });
    expect(exception).toBeInstanceOf(InvalidOrderSideException);
    expect(exception.code).toBe('INVALID_ORDER_SIDE');
  });

  it('maps an invalid type to InvalidOrderTypeException', () => {
    const { error } = createOrderBodySchema.safeParse({
      instrument_id: 47,
      side: 'BUY',
      type: 'STOP',
      size: 1,
    });
    expect(error).toBeDefined();
    const exception = resolveCreateOrderBodyException(error!.issues, {
      instrument_id: 47,
      side: 'BUY',
      type: 'STOP',
      size: 1,
    });
    expect(exception).toBeInstanceOf(InvalidOrderTypeException);
    expect(exception.code).toBe('INVALID_ORDER_TYPE');
  });

  it('keeps ValidationException for other rule violations', () => {
    const { error } = createOrderBodySchema.safeParse({});
    expect(error).toBeDefined();
    const exception = resolveCreateOrderBodyException(error!.issues, {});
    expect(exception).toBeInstanceOf(ValidationException);
  });
});

describe('createOrderValidationPipe', () => {
  const metadata = {
    type: 'body' as const,
    data: undefined,
    metatype: Object,
    schema: createOrderBodySchema,
  };

  it('throws ValidationException with the order message', () => {
    expect(() => createOrderValidationPipe.transform({}, metadata)).toThrow(
      expect.objectContaining({
        name: ValidationException.name,
        code: 'VALIDATION_ERROR',
        message: 'El cuerpo de la orden es inválido.',
      }),
    );
  });

  it('throws InvalidOrderSideException for an unsupported side', () => {
    expect(() =>
      createOrderValidationPipe.transform(
        {
          instrument_id: 47,
          side: 'HOLD',
          type: 'MARKET',
          size: 1,
        },
        metadata,
      ),
    ).toThrow(InvalidOrderSideException);
  });

  it('throws InvalidOrderTypeException for an unsupported type', () => {
    expect(() =>
      createOrderValidationPipe.transform(
        {
          instrument_id: 47,
          side: 'BUY',
          type: 'STOP',
          size: 1,
        },
        metadata,
      ),
    ).toThrow(InvalidOrderTypeException);
  });

  it('throws InvalidOrderSideException for a lowercase side', () => {
    try {
      createOrderValidationPipe.transform(
        {
          instrument_id: 47,
          side: 'buy',
          type: 'MARKET',
          size: 1,
        },
        metadata,
      );
    } catch (error) {
      expect(error).toMatchObject({
        code: 'INVALID_ORDER_SIDE',
      });
    }
  });
});
