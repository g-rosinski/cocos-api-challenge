import { HttpStatus } from '@nestjs/common';
import { ApiClientException } from '@/common/errors/api-client.exception';

export class UserNotFoundException extends ApiClientException {
  constructor() {
    super('USER_NOT_FOUND', HttpStatus.NOT_FOUND, 'La cuenta no existe.');
  }
}
