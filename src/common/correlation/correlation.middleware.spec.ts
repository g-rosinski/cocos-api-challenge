import type { NextFunction, Request, Response } from 'express';
import { callContextStorage } from './call-context.js';
import { CorrelationMiddleware } from './correlation.middleware.js';

describe('CorrelationMiddleware', () => {
  const middleware = new CorrelationMiddleware();
  const response = {
    headers: {} as Record<string, string>,
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
  } as Response;

  beforeEach(() => {
    response.headers = {};
  });

  it('reuses the incoming correlation id', () => {
    const request = {
      header: (name: string) =>
        name === 'x-correlation-id' ? 'incoming-correlation' : undefined,
    } as Request;
    const next: NextFunction = vi.fn();

    middleware.use(request, response, () => {
      expect(callContextStorage.getStore()?.correlationId).toBe(
        'incoming-correlation',
      );
      next();
    });

    expect(response.headers['x-correlation-id']).toBe('incoming-correlation');
    expect(next).toHaveBeenCalledOnce();
  });

  it('generates a correlation id when the header is missing', () => {
    const request = {
      header: () => undefined,
    } as Request;
    const next: NextFunction = vi.fn();

    middleware.use(request, response, () => {
      expect(callContextStorage.getStore()?.correlationId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      next();
    });

    expect(response.headers['x-correlation-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(next).toHaveBeenCalledOnce();
  });
});
