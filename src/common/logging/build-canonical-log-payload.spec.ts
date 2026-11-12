import { buildCanonicalLogPayload } from '@/common/logging/build-canonical-log-payload';

describe('buildCanonicalLogPayload', () => {
  it('builds the default title and context payload', () => {
    const payload = buildCanonicalLogPayload({
      callContext: {
        correlationId: 'corr-1',
        userId: 1,
        attributes: { result_count: 3 },
      },
      method: 'GET',
      path: '/instruments',
      statusCode: 200,
      durationMs: 40,
    });

    expect(payload.message).toBe(
      'GET /instruments - GET /instruments -> 200 40ms',
    );
    expect(payload.correlationId).toBe('corr-1');
    expect(payload.userId).toBe(1);
    expect(payload.context).toEqual({ result_count: 3 });
  });

  it('duplicates business status in context', () => {
    const payload = buildCanonicalLogPayload({
      callContext: {
        correlationId: 'corr-2',
        title: 'CreateOrder',
        status: 'FILLED',
      },
      method: 'POST',
      path: '/orders',
      statusCode: 201,
      durationMs: 90,
    });

    expect(payload.message).toBe(
      'CreateOrder [FILLED] - POST /orders -> 201 90ms',
    );
    expect(payload.context).toEqual({ transaction_status: 'FILLED' });
  });
});
