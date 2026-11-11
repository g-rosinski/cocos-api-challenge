import { HttpStatus } from '@nestjs/common';
import { ApiClientException } from './api-client.exception.js';

export class InstrumentNotTradableException extends ApiClientException {
  constructor(message: string) {
    super('INSTRUMENT_NOT_TRADABLE', HttpStatus.BAD_REQUEST, message);
  }
}
