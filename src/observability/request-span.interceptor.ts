import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import type { Request, Response } from 'express';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { getCallContext } from '../common/correlation/call-context.js';
import { isHealthRequest } from '../common/http/is-health-request.js';
import { applyRequestSpanAttributes } from './apply-request-span-attributes.js';
import { buildRequestSpanAttributes } from './request-attributes.js';

const TRACER_NAME = 'cocos-api-challenge';

@Injectable()
export class RequestSpanInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    if (isHealthRequest(request)) {
      return next.handle();
    }
    const response = context.switchToHttp().getResponse<Response>();
    const route = request.route?.path ?? request.path;
    const spanName = `${request.method} ${route}`;
    const span = trace.getTracer(TRACER_NAME).startSpan(spanName);
    return next.handle().pipe(
      catchError((error: unknown) => {
        if (error instanceof Error) {
          span.recordException(error);
        } else {
          span.recordException(new Error(String(error)));
        }
        return throwError(() => error);
      }),
      finalize(() => {
        const callContext = getCallContext();
        const attributes = buildRequestSpanAttributes({
          callContext,
          route,
          httpStatus: response.statusCode,
        });
        if (attributes !== undefined) {
          applyRequestSpanAttributes(span, attributes);
        }
        span.setStatus({
          code:
            response.statusCode >= 500
              ? SpanStatusCode.ERROR
              : SpanStatusCode.OK,
        });
        span.end();
      }),
    );
  }
}
