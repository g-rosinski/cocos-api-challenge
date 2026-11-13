import type { SchemaObject } from '@nestjs/swagger';
import { IdempotencyKeyMismatchException } from '@/common/errors/idempotency-key-mismatch.exception';
import { InvalidIdempotencyKeyException } from '@/common/errors/invalid-idempotency-key.exception';
import { InvalidOrderSideException } from '@/common/errors/invalid-order-side.exception';
import { InvalidOrderTypeException } from '@/common/errors/invalid-order-type.exception';
import { InvalidUserIdException } from '@/common/errors/invalid-user-id.exception';
import { UserNotFoundException } from '@/common/errors/user-not-found.exception';
import { ValidationException } from '@/common/errors/validation.exception';
import type { ErrorResponse } from '@/common/errors/error-response';

export const SAMPLE_CORRELATION_ID = '8f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21';

const errorCodes = [
  'INVALID_USER_ID',
  'INVALID_ORDER_SIDE',
  'INVALID_ORDER_TYPE',
  'VALIDATION_ERROR',
  'USER_NOT_FOUND',
  'INSTRUMENT_NOT_FOUND',
  'INSTRUMENT_NOT_TRADABLE',
  'PRICE_UNAVAILABLE',
  'INVALID_IDEMPOTENCY_KEY',
  'IDEMPOTENCY_KEY_MISMATCH',
  'INTERNAL_ERROR',
] as const;

export const errorResponseSchema: SchemaObject = {
  type: 'object',
  required: ['error'],
  properties: {
    error: {
      type: 'object',
      required: ['code', 'message', 'correlation_id'],
      properties: {
        code: { type: 'string', enum: [...errorCodes] },
        message: { type: 'string' },
        correlation_id: { type: 'string', format: 'uuid' },
      },
    },
  },
};

export function errorExample(
  summary: string,
  code: ErrorResponse['error']['code'],
  message: string,
): { summary: string; value: ErrorResponse } {
  return {
    summary,
    value: {
      error: {
        code,
        message,
        correlation_id: SAMPLE_CORRELATION_ID,
      },
    },
  };
}

export const missingUserIdExample = errorExample(
  'Consultar sin identificar cuenta',
  'INVALID_USER_ID',
  new InvalidUserIdException().message,
);

export const invalidUserIdExample = errorExample(
  'Consultar con identificador inválido',
  'INVALID_USER_ID',
  new InvalidUserIdException().message,
);

export const unknownAccountExample = errorExample(
  'Consultar cuenta inexistente',
  'USER_NOT_FOUND',
  new UserNotFoundException().message,
);

export const invalidIdempotencyKeyExample = errorExample(
  'Orden con clave de idempotencia inválida',
  'INVALID_IDEMPOTENCY_KEY',
  new InvalidIdempotencyKeyException().message,
);

export const idempotencyMismatchExample = errorExample(
  'Reutilizar clave con otro pedido',
  'IDEMPOTENCY_KEY_MISMATCH',
  new IdempotencyKeyMismatchException().message,
);

export const invalidOrderBodyExample = errorExample(
  'Orden con cuerpo inválido',
  'VALIDATION_ERROR',
  new ValidationException().message,
);

export const invalidOrderSideExample = errorExample(
  'Orden con side inválido',
  'INVALID_ORDER_SIDE',
  new InvalidOrderSideException().message,
);

export const invalidOrderTypeExample = errorExample(
  'Orden con type inválido',
  'INVALID_ORDER_TYPE',
  new InvalidOrderTypeException().message,
);

export const databaseDownExample = errorExample(
  'Llamada con base no disponible',
  'INTERNAL_ERROR',
  'Error interno.',
);
