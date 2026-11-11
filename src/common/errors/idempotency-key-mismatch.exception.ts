import { HttpStatus } from '@nestjs/common';
import { ApiClientException } from './api-client.exception.js';

export class IdempotencyKeyMismatchException extends ApiClientException {
  constructor() {
    super(
      'IDEMPOTENCY_KEY_MISMATCH',
      HttpStatus.BAD_REQUEST,
      'La clave de idempotencia ya fue utilizada con otros parámetros.',
    );
  }
}
