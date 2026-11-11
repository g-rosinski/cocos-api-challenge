import { HttpStatus } from '@nestjs/common';
import { ApiClientException } from './api-client.exception.js';

export class ValidationException extends ApiClientException {
  constructor(message = 'El cuerpo de la orden es inválido.') {
    super('VALIDATION_ERROR', HttpStatus.BAD_REQUEST, message);
  }
}
