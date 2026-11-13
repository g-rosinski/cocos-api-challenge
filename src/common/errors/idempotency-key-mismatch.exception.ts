import { HttpStatus } from '@nestjs/common';
import { ApiClientException } from '@/common/errors/api-client.exception';

export class IdempotencyKeyMismatchException extends ApiClientException {
  constructor() {
    super(
      'IDEMPOTENCY_KEY_MISMATCH',
      HttpStatus.BAD_REQUEST,
      'La clave de idempotencia ya fue utilizada con otros parámetros.',
    );
  }
}
