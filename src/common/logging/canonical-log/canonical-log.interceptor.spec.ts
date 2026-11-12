import { CallHandler, ExecutionContext, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { firstValueFrom, of, throwError } from 'rxjs';
import { callContextStorage } from '@/common/logging/call-context/call-context';
import { CanonicalLogInterceptor } from '@/common/logging/canonical-log/canonical-log.interceptor';

describe('CanonicalLogInterceptor', () => {
  const interceptor = new CanonicalLogInterceptor();

  function createContext(
    request: Partial<Request>,
    response: Partial<Response>,
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => request as Request,
        getResponse: () => response as Response,
      }),
    } as ExecutionContext;
  }

  it('skips canonical logging on health', async () => {
    const logSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    const context = createContext(
      { method: 'GET', path: '/health' },
      { statusCode: 200 },
    );
    const handler: CallHandler = { handle: () => of({ status: 'ok' }) };

    await firstValueFrom(interceptor.intercept(context, handler));

    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('emits an info canonical log for successful requests', async () => {
    const logSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    const context = createContext(
      { method: 'GET', path: '/instruments', route: { path: '/instruments' } },
      { statusCode: 200 },
    );
    const handler: CallHandler = { handle: () => of([]) };

    await callContextStorage.run({ correlationId: 'corr-log-1' }, async () => {
      await firstValueFrom(interceptor.intercept(context, handler));
    });

    expect(logSpy).toHaveBeenCalledOnce();
    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0])) as {
      message: string;
      correlationId: string;
    };
    expect(payload.correlationId).toBe('corr-log-1');
    expect(payload.message).toMatch(
      /^GET \/instruments - GET \/instruments -> 200 \d+ms$/,
    );
    logSpy.mockRestore();
  });

  it('skips logging when there is no call context', async () => {
    const logSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    const context = createContext(
      { method: 'GET', path: '/instruments', route: { path: '/instruments' } },
      { statusCode: 200 },
    );
    const handler: CallHandler = { handle: () => of([]) };

    await firstValueFrom(interceptor.intercept(context, handler));

    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('emits an error canonical log for server failures', async () => {
    const errorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const context = createContext(
      { method: 'GET', path: '/portfolio', route: { path: '/portfolio' } },
      { statusCode: 500 },
    );
    const handler: CallHandler = {
      handle: () => throwError(() => new Error('fail')),
    };

    await callContextStorage.run({ correlationId: 'corr-log-2' }, async () => {
      await expect(
        firstValueFrom(interceptor.intercept(context, handler)),
      ).rejects.toThrow('fail');
    });

    expect(errorSpy).toHaveBeenCalledOnce();
    errorSpy.mockRestore();
  });
});
