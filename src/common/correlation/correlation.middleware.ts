import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { callContextStorage } from '@/common/correlation/call-context';
import { readCorrelationId } from '@/common/correlation/read-correlation-id';

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const correlationId = readCorrelationId(request.header('x-correlation-id'));
    response.setHeader('x-correlation-id', correlationId);
    callContextStorage.run({ correlationId }, () => next());
  }
}
