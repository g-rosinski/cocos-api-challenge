import type { ClientErrorCode } from './client-error-code.js';

export type ErrorResponse = {
  error: {
    code: ClientErrorCode | 'INTERNAL_ERROR';
    message: string;
    correlation_id: string;
  };
};
