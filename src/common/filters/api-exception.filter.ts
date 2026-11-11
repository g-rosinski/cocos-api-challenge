import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { getCallContext } from '../correlation/call-context.js';
import { ApiClientException } from '../errors/api-client.exception.js';
import { DependencyException } from '../errors/dependency.exception.js';
import type { ErrorResponse } from '../errors/error-response.js';
import { InternalException } from '../errors/internal.exception.js';
import { isHealthRequest } from '../http/is-health-request.js';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ApiExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();

    if (isHealthRequest(request)) {
      this.handleHealthException(exception, response);
      return;
    }

    const correlationId = getCallContext()?.correlationId ?? '';

    if (exception instanceof ApiClientException) {
      this.sendError(response, exception.httpStatus, {
        error: {
          code: exception.code,
          message: exception.message,
          correlation_id: correlationId,
        },
      });
      return;
    }

    if (exception instanceof QueryFailedError) {
      this.logger.error(
        JSON.stringify({ correlationId, message: exception.message }),
        exception.stack,
      );
      this.sendInternalError(response, correlationId);
      return;
    }

    if (exception instanceof DependencyException) {
      this.logger.error(
        JSON.stringify({ correlationId, message: exception.message }),
        exception.cause instanceof Error ? exception.cause.stack : undefined,
      );
      this.sendInternalError(response, correlationId);
      return;
    }

    if (exception instanceof InternalException) {
      this.logger.error(
        JSON.stringify({ correlationId, message: exception.message }),
        exception.cause instanceof Error ? exception.cause.stack : undefined,
      );
      this.sendInternalError(response, correlationId);
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (status < HttpStatus.INTERNAL_SERVER_ERROR) {
        response.status(status).json(body);
        return;
      }
    }

    this.logger.error(
      JSON.stringify({ correlationId, message: 'Unhandled exception' }),
      exception instanceof Error ? exception.stack : undefined,
    );
    this.sendInternalError(response, correlationId);
  }

  private handleHealthException(exception: unknown, response: Response): void {
    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ status: 'error' });
  }

  private sendInternalError(response: Response, correlationId: string): void {
    this.sendError(response, HttpStatus.INTERNAL_SERVER_ERROR, {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error interno.',
        correlation_id: correlationId,
      },
    });
  }

  private sendError(
    response: Response,
    statusCode: number,
    body: ErrorResponse,
  ): void {
    response.status(statusCode).json(body);
  }
}
