import type { ClientErrorCode } from './client-error-code.js';

export class ApiClientException extends Error {
  constructor(
    readonly code: ClientErrorCode,
    readonly httpStatus: number,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}
