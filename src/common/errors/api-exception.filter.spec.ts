import {
  BadRequestException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { callContextStorage } from '@/common/logging/call-context/call-context';
import { DependencyException } from '@/common/errors/dependency.exception';
import { InternalException } from '@/common/errors/internal.exception';
import { InvalidUserIdException } from '@/common/errors/invalid-user-id.exception';
import { UserNotFoundException } from '@/common/errors/user-not-found.exception';
import { ApiExceptionFilter } from '@/common/errors/api-exception.filter';

describe('ApiExceptionFilter', () => {
  const filter = new ApiExceptionFilter();

  function createHost(
    path: string,
    method: string,
  ): {
    host: Parameters<ApiExceptionFilter['catch']>[1];
    response: {
      statusCode: number;
      body: unknown;
      status: (code: number) => { json: (payload: unknown) => void };
    };
  } {
    const response = {
      statusCode: 200,
      body: undefined as unknown,
      status(code: number) {
        this.statusCode = code;
        return {
          json: (payload: unknown) => {
            this.body = payload;
          },
        };
      },
    };
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({ method, path }),
      }),
    } as Parameters<ApiExceptionFilter['catch']>[1];
    return { host, response };
  }

  it('maps client errors to the RFC body with correlation id', () => {
    const { host, response } = createHost('/portfolio', 'GET');
    callContextStorage.run({ correlationId: 'corr-1' }, () => {
      filter.catch(new InvalidUserIdException(), host);
    });

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body).toEqual({
      error: {
        code: 'INVALID_USER_ID',
        message:
          'El header x-user-id es obligatorio y tiene que ser un entero.',
        correlation_id: 'corr-1',
      },
    });
  });

  it('maps user not found to 404', () => {
    const { host, response } = createHost('/portfolio', 'GET');
    callContextStorage.run({ correlationId: 'corr-2' }, () => {
      filter.catch(new UserNotFoundException(), host);
    });

    expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(response.body).toEqual({
      error: {
        code: 'USER_NOT_FOUND',
        message: 'La cuenta no existe.',
        correlation_id: 'corr-2',
      },
    });
  });

  it('hides postgres failures behind INTERNAL_ERROR', () => {
    const { host, response } = createHost('/portfolio', 'GET');
    const driverError = new Error('connection refused');
    const logSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    callContextStorage.run({ correlationId: 'corr-3' }, () => {
      filter.catch(new QueryFailedError('SELECT 1', [], driverError), host);
    });
    logSpy.mockRestore();

    expect(response.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.body).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error interno.',
        correlation_id: 'corr-3',
      },
    });
  });

  it('does not expose the RFC error envelope on health', () => {
    const { host, response } = createHost('/health', 'GET');
    filter.catch(new InvalidUserIdException(), host);

    expect(response.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.body).toEqual({ status: 'error' });
  });

  it('maps dependency failures behind INTERNAL_ERROR', () => {
    const { host, response } = createHost('/portfolio', 'GET');
    const logSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    callContextStorage.run({ correlationId: 'corr-4' }, () => {
      filter.catch(new DependencyException(new Error('db down')), host);
    });
    logSpy.mockRestore();

    expect(response.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.body).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error interno.',
        correlation_id: 'corr-4',
      },
    });
  });

  it('logs dependency failures without an Error cause stack', () => {
    const { host, response } = createHost('/portfolio', 'GET');
    const logSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    callContextStorage.run({ correlationId: 'corr-4b' }, () => {
      filter.catch(new DependencyException('offline'), host);
    });
    logSpy.mockRestore();

    expect(response.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.body).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error interno.',
        correlation_id: 'corr-4b',
      },
    });
  });

  it('maps internal failures behind INTERNAL_ERROR', () => {
    const { host, response } = createHost('/portfolio', 'GET');
    const logSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    callContextStorage.run({ correlationId: 'corr-5' }, () => {
      filter.catch(new InternalException(new Error('unexpected')), host);
    });
    logSpy.mockRestore();

    expect(response.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.body).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error interno.',
        correlation_id: 'corr-5',
      },
    });
  });

  it('logs internal failures without an Error cause stack', () => {
    const { host, response } = createHost('/portfolio', 'GET');
    const logSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    callContextStorage.run({ correlationId: 'corr-5b' }, () => {
      filter.catch(new InternalException('opaque'), host);
    });
    logSpy.mockRestore();

    expect(response.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.body).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error interno.',
        correlation_id: 'corr-5b',
      },
    });
  });

  it('forwards client HttpException bodies without the RFC envelope', () => {
    const { host, response } = createHost('/portfolio', 'GET');
    filter.catch(new NotFoundException('missing route'), host);

    expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(response.body).toMatchObject({
      message: 'missing route',
      statusCode: HttpStatus.NOT_FOUND,
    });
  });

  it('maps unhandled exceptions behind INTERNAL_ERROR', () => {
    const { host, response } = createHost('/portfolio', 'GET');
    const logSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    callContextStorage.run({ correlationId: 'corr-6' }, () => {
      filter.catch(new Error('boom'), host);
    });
    logSpy.mockRestore();

    expect(response.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.body).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error interno.',
        correlation_id: 'corr-6',
      },
    });
  });

  it('maps unhandled non-Error throwables behind INTERNAL_ERROR', () => {
    const { host, response } = createHost('/portfolio', 'GET');
    const logSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    callContextStorage.run({ correlationId: 'corr-6b' }, () => {
      filter.catch('unexpected string', host);
    });
    logSpy.mockRestore();

    expect(response.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.body).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error interno.',
        correlation_id: 'corr-6b',
      },
    });
  });

  it('maps server HttpException failures behind INTERNAL_ERROR', () => {
    const { host, response } = createHost('/portfolio', 'GET');
    const logSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    callContextStorage.run({ correlationId: 'corr-7' }, () => {
      filter.catch(new InternalServerErrorException('internal boom'), host);
    });
    logSpy.mockRestore();

    expect(response.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.body).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error interno.',
        correlation_id: 'corr-7',
      },
    });
  });

  it('forwards HttpException on health without the RFC envelope', () => {
    const { host, response } = createHost('/health', 'GET');
    filter.catch(new BadRequestException('bad health probe'), host);

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body).toMatchObject({
      message: 'bad health probe',
      statusCode: HttpStatus.BAD_REQUEST,
    });
  });
});
