import type { ClientErrorCode } from '@/common/errors/client-error-code';

export type ErrorResponse = {
  error: {
    code: ClientErrorCode | 'INTERNAL_ERROR';
    message: string;
    correlation_id: string;
  };
};
