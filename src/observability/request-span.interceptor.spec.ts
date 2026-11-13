import { CallHandler, ExecutionContext } from '@nestjs/common';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import type { Request, Response } from 'express';
import type { Span, Tracer } from '@opentelemetry/api';
import { firstValueFrom, of, throwError } from 'rxjs';
import { callContextStorage } from '@/common/logging/call-context/call-context';
import { RequestSpanInterceptor } from '@/observability/request-span.interceptor';

describe('RequestSpanInterceptor', () => {
  const interceptor = new RequestSpanInterceptor();

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

  function mockTracer(span: Span): Tracer {
    return {
      startSpan: vi.fn(() => span),
    } as unknown as Tracer;
  }

  it('skips tracing on health', async () => {
    const span = {
      setAttribute: vi.fn(),
      setStatus: vi.fn(),
      end: vi.fn(),
      recordException: vi.fn(),
    } as unknown as Span;
    const tracerSpy = vi
      .spyOn(trace, 'getTracer')
      .mockReturnValue(mockTracer(span));
    const context = createContext(
      { method: 'GET', path: '/health' },
      { statusCode: 200 },
    );
    const handler: CallHandler = { handle: () => of({ status: 'ok' }) };

    await firstValueFrom(interceptor.intercept(context, handler));

    expect(tracerSpy).not.toHaveBeenCalled();
    tracerSpy.mockRestore();
  });

  it('ends the span without attributes when call context is missing', async () => {
    const setAttribute = vi.fn();
    const end = vi.fn();
    const span = {
      setAttribute,
      setStatus: vi.fn(),
      end,
      recordException: vi.fn(),
    } as unknown as Span;
    vi.spyOn(trace, 'getTracer').mockReturnValue(mockTracer(span));
    const context = createContext(
      { method: 'GET', path: '/instruments' },
      { statusCode: 200 },
    );
    const handler: CallHandler = { handle: () => of([]) };

    await firstValueFrom(interceptor.intercept(context, handler));

    expect(setAttribute).not.toHaveBeenCalled();
    expect(end).toHaveBeenCalledOnce();
  });

  it('sets request attributes without userId on search', async () => {
    const setAttribute = vi.fn();
    const end = vi.fn();
    const span = {
      setAttribute,
      setStatus: vi.fn(),
      end,
      recordException: vi.fn(),
    } as unknown as Span;
    vi.spyOn(trace, 'getTracer').mockReturnValue(mockTracer(span));
    const context = createContext(
      { method: 'GET', path: '/instruments', route: { path: '/instruments' } },
      { statusCode: 200 },
    );
    const handler: CallHandler = { handle: () => of([]) };

    await callContextStorage.run({ correlationId: 'corr-otel-1' }, async () => {
      await firstValueFrom(interceptor.intercept(context, handler));
    });

    expect(setAttribute).toHaveBeenCalledWith('correlationId', 'corr-otel-1');
    expect(setAttribute).toHaveBeenCalledWith('route', '/instruments');
    expect(setAttribute).toHaveBeenCalledWith('httpStatus', 200);
    expect(setAttribute).not.toHaveBeenCalledWith('userId', expect.anything());
    expect(end).toHaveBeenCalledOnce();
  });

  it('sets order attributes when the call context has a completed order', async () => {
    const setAttribute = vi.fn();
    const span = {
      setAttribute,
      setStatus: vi.fn(),
      end: vi.fn(),
      recordException: vi.fn(),
    } as unknown as Span;
    vi.spyOn(trace, 'getTracer').mockReturnValue(mockTracer(span));
    const context = createContext(
      { method: 'POST', path: '/orders', route: { path: '/orders' } },
      { statusCode: 201 },
    );
    const handler: CallHandler = { handle: () => of({}) };

    await callContextStorage.run(
      {
        correlationId: 'corr-otel-2',
        userId: 4,
        status: 'NEW',
        attributes: { side: 'BUY', type: 'LIMIT' },
      },
      async () => {
        await firstValueFrom(interceptor.intercept(context, handler));
      },
    );

    expect(setAttribute).toHaveBeenCalledWith('orderSide', 'BUY');
    expect(setAttribute).toHaveBeenCalledWith('orderType', 'LIMIT');
    expect(setAttribute).toHaveBeenCalledWith('orderStatus', 'NEW');
    expect(setAttribute).toHaveBeenCalledWith('userId', 4);
  });

  it('records non-Error throwables on the span', async () => {
    const recordException = vi.fn();
    const span = {
      setAttribute: vi.fn(),
      setStatus: vi.fn(),
      end: vi.fn(),
      recordException,
    } as unknown as Span;
    vi.spyOn(trace, 'getTracer').mockReturnValue(mockTracer(span));
    const context = createContext(
      { method: 'GET', path: '/portfolio', route: { path: '/portfolio' } },
      { statusCode: 500 },
    );
    const handler: CallHandler = {
      handle: () => throwError(() => 'plain failure'),
    };

    await callContextStorage.run({ correlationId: 'corr-otel-4' }, async () => {
      await expect(
        firstValueFrom(interceptor.intercept(context, handler)),
      ).rejects.toBe('plain failure');
    });

    expect(recordException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'plain failure' }),
    );
  });

  it('marks server failures on the span', async () => {
    const setStatus = vi.fn();
    const span = {
      setAttribute: vi.fn(),
      setStatus,
      end: vi.fn(),
      recordException: vi.fn(),
    } as unknown as Span;
    vi.spyOn(trace, 'getTracer').mockReturnValue(mockTracer(span));
    const context = createContext(
      { method: 'GET', path: '/portfolio', route: { path: '/portfolio' } },
      { statusCode: 500 },
    );
    const handler: CallHandler = {
      handle: () => throwError(() => new Error('fail')),
    };

    await callContextStorage.run({ correlationId: 'corr-otel-3' }, async () => {
      await expect(
        firstValueFrom(interceptor.intercept(context, handler)),
      ).rejects.toThrow('fail');
    });

    expect(setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
    expect(setStatus).toHaveBeenCalledOnce();
  });
});
