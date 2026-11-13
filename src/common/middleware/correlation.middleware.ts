import { randomUUID } from 'node:crypto';
import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { callContextStorage } from '@/common/logging/call-context/call-context';

function readCorrelationId(headerValue: string | undefined): string {
  const trimmed = headerValue?.trim();
  if (trimmed !== undefined && trimmed.length > 0) {
    return trimmed;
  }
  return randomUUID();
}

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const correlationId = readCorrelationId(request.header('x-correlation-id'));
    response.setHeader('x-correlation-id', correlationId);
    callContextStorage.run({ correlationId }, () => next());
  }
}
