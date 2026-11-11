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
import { buildCanonicalLogPayload } from './build-canonical-log-payload.js';
import { emitCanonicalLog } from './emit-canonical-log.js';
import { resolveCanonicalLogLevel } from './resolve-canonical-log-level.js';

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
        const path = request.route?.path ?? request.path;
        const durationMs = Date.now() - startedAt;
        const payload = buildCanonicalLogPayload({
          callContext,
          method: request.method,
          path,
          statusCode: response.statusCode,
          durationMs,
        });
        const level = resolveCanonicalLogLevel(response.statusCode);
        emitCanonicalLog(this.logger, level, JSON.stringify(payload));
      }),
    );
  }
}
