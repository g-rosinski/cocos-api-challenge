import { HttpStatus } from '@nestjs/common';
import { ApiClientException } from '@/common/errors/api-client.exception';

export class PriceUnavailableException extends ApiClientException {
  constructor(message: string) {
    super('PRICE_UNAVAILABLE', HttpStatus.BAD_REQUEST, message);
  }
}
