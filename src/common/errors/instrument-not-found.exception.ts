import { HttpStatus } from '@nestjs/common';
import { ApiClientException } from '@/common/errors/api-client.exception';

export class InstrumentNotFoundException extends ApiClientException {
  constructor(message: string) {
    super('INSTRUMENT_NOT_FOUND', HttpStatus.NOT_FOUND, message);
  }
}
