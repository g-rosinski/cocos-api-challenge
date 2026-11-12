import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { getCallContext } from '@/common/logging/call-context/call-context';
import { isHealthRequest } from '@/common/http/is-health-request';
import { buildCanonicalLogPayload } from '@/common/logging/canonical-log/build-canonical-log-payload';
import { emitCanonicalLog } from '@/common/logging/canonical-log/emit-canonical-log';
import { resolveCanonicalLogLevel } from '@/common/logging/canonical-log/resolve-canonical-log-level';

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
