import { HttpStatus } from '@nestjs/common';
import { ApiClientException } from '@/common/errors/api-client.exception';

export class InvalidUserIdException extends ApiClientException {
  constructor() {
    super(
      'INVALID_USER_ID',
      HttpStatus.BAD_REQUEST,
      'El header x-user-id es obligatorio y tiene que ser un entero.',
    );
  }
}
