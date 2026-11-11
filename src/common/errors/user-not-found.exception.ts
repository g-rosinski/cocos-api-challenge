import { HttpStatus } from '@nestjs/common';
import { ApiClientException } from './api-client.exception.js';

export class UserNotFoundException extends ApiClientException {
  constructor() {
    super('USER_NOT_FOUND', HttpStatus.NOT_FOUND, 'La cuenta no existe.');
  }
}
