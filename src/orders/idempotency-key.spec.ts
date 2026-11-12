import { type ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants.js';
import { InvalidIdempotencyKeyException } from '../common/errors/invalid-idempotency-key.exception.js';
import {
  IdempotencyKey,
  idempotencyKeySchema,
  idempotencyKeyValidationPipe,
  readIdempotencyHeader,
} from './idempotency-key.js';

describe('idempotencyKeySchema', () => {
  it('accepts a UUID and stores it in lowercase', () => {
    expect(
      idempotencyKeySchema.parse('6F1C0D4E-2A1B-4C77-9D2A-1B6E0A9C4F21'),
    ).toBe('6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21');
  });

  it.each([undefined, '', 'order-1', '6f1c0d4e-2a1b-4c77-9d2a'])(
    'rejects %j',
    (value) => {
      expect(idempotencyKeySchema.safeParse(value).success).toBe(false);
    },
  );
});

describe('idempotencyKeyValidationPipe', () => {
  it('throws InvalidIdempotencyKeyException', async () => {
    await expect(
      idempotencyKeyValidationPipe.transform('order-1', {
        type: 'custom',
        data: 'idempotency-key',
        metatype: String,
        schema: idempotencyKeySchema,
      }),
    ).rejects.toBeInstanceOf(InvalidIdempotencyKeyException);
  });
});

describe('readIdempotencyHeader', () => {
  it('reads a single header value', () => {
    expect(
      readIdempotencyHeader({
        'idempotency-key': '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21',
      }),
    ).toBe('6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21');
  });

  it('reads the only value when the header arrives as a one-item array', () => {
    expect(
      readIdempotencyHeader({
        'idempotency-key': ['6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21'],
      }),
    ).toBe('6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21');
  });

  it('reads the header through the parameter decorator', () => {
    class ProbeController {
      create(@IdempotencyKey() idempotencyKey: string): string {
        return idempotencyKey;
      }
    }

    const metadata: unknown = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      ProbeController,
      'create',
    );
    const entry = Object.values(
      metadata as Record<string, { factory: (...args: unknown[]) => unknown }>,
    )[0];
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            'idempotency-key': '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21',
          },
        }),
      }),
    } as ExecutionContext;

    expect(entry?.factory(undefined, context)).toBe(
      '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21',
    );
  });

  it('drops duplicate header values', () => {
    expect(
      readIdempotencyHeader({
        'idempotency-key': [
          '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21',
          '7a2b3c4d-5e6f-4789-a012-b3c4d5e6f789',
        ],
      }),
    ).toBeUndefined();
  });
});
