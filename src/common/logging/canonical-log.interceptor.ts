import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { getCallContext } from '../correlation/call-context.js';
import { isHealthRequest } from '../http/is-health-request.js';

@Injectable()
export class CanonicalLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('CanonicalLog');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    if (isHealthRequest(request)) {
      return next.handle();
    }
    const startedAt = Date.now();
    const response = context.switchToHttp().getResponse<Response>();
    return next.handle().pipe(
      catchError((error: unknown) => throwError(() => error)),
      finalize(() => {
        const callContext = getCallContext();
        if (callContext === undefined) {
          return;
        }
        const event: Record<string, string | number> = {
          correlationId: callContext.correlationId,
          method: request.method,
          route: request.route?.path ?? request.path,
          statusCode: response.statusCode,
          durationMs: Date.now() - startedAt,
        };
        if (callContext.userId !== undefined) {
          event.userId = callContext.userId;
        }
        this.logger.debug(JSON.stringify(event));
      }),
    );
  }
}
