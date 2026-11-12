import { HttpStatus } from '@nestjs/common';
import { ApiClientException } from '@/common/errors/api-client.exception';

export class InvalidOrderTypeException extends ApiClientException {
  constructor() {
    super(
      'INVALID_ORDER_TYPE',
      HttpStatus.BAD_REQUEST,
      'El campo type solo admite MARKET o LIMIT.',
    );
  }
}
