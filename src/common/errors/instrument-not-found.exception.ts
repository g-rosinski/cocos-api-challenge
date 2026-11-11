import { HttpStatus } from '@nestjs/common';
import { ApiClientException } from './api-client.exception.js';

export class InstrumentNotFoundException extends ApiClientException {
  constructor(message: string) {
    super('INSTRUMENT_NOT_FOUND', HttpStatus.NOT_FOUND, message);
  }
}
