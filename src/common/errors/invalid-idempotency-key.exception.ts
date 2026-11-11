import { HttpStatus } from '@nestjs/common';
import { ApiClientException } from './api-client.exception.js';

export class InvalidIdempotencyKeyException extends ApiClientException {
  constructor() {
    super(
      'INVALID_IDEMPOTENCY_KEY',
      HttpStatus.BAD_REQUEST,
      'El header Idempotency-Key es obligatorio y tiene que ser un UUID.',
    );
  }
}
