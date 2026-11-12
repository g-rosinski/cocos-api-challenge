import {
  createParamDecorator,
  type ExecutionContext,
  StandardSchemaValidationPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { InvalidIdempotencyKeyException } from '../common/errors/invalid-idempotency-key.exception.js';

export const idempotencyKeySchema = z
  .uuid()
  .transform((value) => value.toLowerCase());

export const idempotencyKeyValidationPipe = new StandardSchemaValidationPipe({
  validateCustomDecorators: true,
  exceptionFactory: () => new InvalidIdempotencyKeyException(),
});

export function readIdempotencyHeader(
  headers: Request['headers'],
): string | undefined {
  const header = headers['idempotency-key'];
  if (Array.isArray(header)) {
    return header.length === 1 ? header[0] : undefined;
  }
  return header;
}

export const IdempotencyKey = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | undefined => {
    const request = context.switchToHttp().getRequest<Request>();
    return readIdempotencyHeader(request.headers);
  },
);
