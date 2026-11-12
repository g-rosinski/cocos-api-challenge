import { HttpStatus } from '@nestjs/common';
import { ApiClientException } from './api-client.exception.js';

export class InvalidOrderSideException extends ApiClientException {
  constructor() {
    super(
      'INVALID_ORDER_SIDE',
      HttpStatus.BAD_REQUEST,
      'El campo side solo admite BUY o SELL.',
    );
  }
}
