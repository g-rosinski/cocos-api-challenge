import { HttpStatus } from '@nestjs/common';
import { ApiClientException } from './api-client.exception.js';

export class PriceUnavailableException extends ApiClientException {
  constructor(message: string) {
    super('PRICE_UNAVAILABLE', HttpStatus.BAD_REQUEST, message);
  }
}
