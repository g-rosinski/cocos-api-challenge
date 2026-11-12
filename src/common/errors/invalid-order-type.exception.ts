import { HttpStatus } from '@nestjs/common';
import { ApiClientException } from './api-client.exception.js';

export class InvalidOrderTypeException extends ApiClientException {
  constructor() {
    super(
      'INVALID_ORDER_TYPE',
      HttpStatus.BAD_REQUEST,
      'El campo type solo admite MARKET o LIMIT.',
    );
  }
}
