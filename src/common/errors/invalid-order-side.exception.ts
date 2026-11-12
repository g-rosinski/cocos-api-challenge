import { HttpStatus } from '@nestjs/common';
import { ApiClientException } from '@/common/errors/api-client.exception';

export class InvalidOrderSideException extends ApiClientException {
  constructor() {
    super(
      'INVALID_ORDER_SIDE',
      HttpStatus.BAD_REQUEST,
      'El campo side solo admite BUY o SELL.',
    );
  }
}
