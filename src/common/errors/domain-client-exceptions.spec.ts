import { HttpStatus } from '@nestjs/common';
import { IdempotencyKeyMismatchException } from './idempotency-key-mismatch.exception.js';
import { InstrumentNotFoundException } from './instrument-not-found.exception.js';
import { InstrumentNotTradableException } from './instrument-not-tradable.exception.js';
import { InvalidIdempotencyKeyException } from './invalid-idempotency-key.exception.js';
import { InvalidOrderSideException } from './invalid-order-side.exception.js';
import { InvalidOrderTypeException } from './invalid-order-type.exception.js';
import { PriceUnavailableException } from './price-unavailable.exception.js';
import { ValidationException } from './validation.exception.js';

describe('domain client exceptions', () => {
  it.each([
    {
      name: 'ValidationException',
      exception: new ValidationException(),
      code: 'VALIDATION_ERROR',
      status: HttpStatus.BAD_REQUEST,
      message: 'El cuerpo de la orden es inválido.',
    },
    {
      name: 'InvalidIdempotencyKeyException',
      exception: new InvalidIdempotencyKeyException(),
      code: 'INVALID_IDEMPOTENCY_KEY',
      status: HttpStatus.BAD_REQUEST,
      message:
        'El header Idempotency-Key es obligatorio y tiene que ser un UUID.',
    },
    {
      name: 'InvalidOrderSideException',
      exception: new InvalidOrderSideException(),
      code: 'INVALID_ORDER_SIDE',
      status: HttpStatus.BAD_REQUEST,
      message: 'El campo side solo admite BUY o SELL.',
    },
    {
      name: 'InvalidOrderTypeException',
      exception: new InvalidOrderTypeException(),
      code: 'INVALID_ORDER_TYPE',
      status: HttpStatus.BAD_REQUEST,
      message: 'El campo type solo admite MARKET o LIMIT.',
    },
    {
      name: 'IdempotencyKeyMismatchException',
      exception: new IdempotencyKeyMismatchException(),
      code: 'IDEMPOTENCY_KEY_MISMATCH',
      status: HttpStatus.BAD_REQUEST,
      message:
        'La clave de idempotencia ya fue utilizada con otros parámetros.',
    },
    {
      name: 'InstrumentNotFoundException',
      exception: new InstrumentNotFoundException('El instrumento no existe.'),
      code: 'INSTRUMENT_NOT_FOUND',
      status: HttpStatus.NOT_FOUND,
      message: 'El instrumento no existe.',
    },
    {
      name: 'InstrumentNotTradableException',
      exception: new InstrumentNotTradableException(
        'El instrumento no es operable.',
      ),
      code: 'INSTRUMENT_NOT_TRADABLE',
      status: HttpStatus.BAD_REQUEST,
      message: 'El instrumento no es operable.',
    },
    {
      name: 'PriceUnavailableException',
      exception: new PriceUnavailableException('No hay cierre disponible.'),
      code: 'PRICE_UNAVAILABLE',
      status: HttpStatus.BAD_REQUEST,
      message: 'No hay cierre disponible.',
    },
  ])(
    '$name exposes RFC code and status',
    ({ exception, code, status, message }) => {
      expect(exception.code).toBe(code);
      expect(exception.httpStatus).toBe(status);
      expect(exception.message).toBe(message);
    },
  );
});
