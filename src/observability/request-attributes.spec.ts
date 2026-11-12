import { callContextStorage } from '@/common/logging/call-context/call-context';
import {
  buildRequestSpanAttributes,
  forbiddenKeysInAttributes,
  isOrderAttributes,
} from '@/observability/request-attributes';

describe('buildRequestSpanAttributes', () => {
  it('returns undefined when there is no call context', () => {
    expect(
      buildRequestSpanAttributes({
        callContext: undefined,
        route: '/instruments',
        httpStatus: 200,
      }),
    ).toBeUndefined();
  });

  it('omits userId on instrument search', () => {
    const attributes = buildRequestSpanAttributes({
      callContext: { correlationId: 'corr-search' },
      route: '/instruments',
      httpStatus: 200,
    });
    expect(attributes).toEqual({
      correlationId: 'corr-search',
      route: '/instruments',
      httpStatus: 200,
    });
    expect(attributes?.userId).toBeUndefined();
  });

  it('includes userId when the call context has it', () => {
    const attributes = buildRequestSpanAttributes({
      callContext: { correlationId: 'corr-portfolio', userId: 4 },
      route: '/portfolio',
      httpStatus: 200,
    });
    expect(attributes?.userId).toBe(4);
  });

  it('adds order fields when the call context has a completed order', () => {
    const attributes = buildRequestSpanAttributes({
      callContext: {
        correlationId: 'corr-order',
        userId: 4,
        status: 'FILLED',
        attributes: { side: 'BUY', type: 'MARKET', order_id: 99 },
      },
      route: '/orders',
      httpStatus: 201,
    });
    expect(isOrderAttributes(attributes!)).toBe(true);
    if (attributes === undefined || !isOrderAttributes(attributes)) {
      throw new Error('expected order attributes');
    }
    expect(attributes.orderSide).toBe('BUY');
    expect(attributes.orderType).toBe('MARKET');
    expect(attributes.orderStatus).toBe('FILLED');
    expect(forbiddenKeysInAttributes(attributes)).toEqual([]);
  });

  it('never exposes email or accountNumber in order attribute sets', () => {
    callContextStorage.run(
      {
        correlationId: 'corr-pii',
        userId: 4,
        status: 'REJECTED',
        attributes: {
          side: 'SELL',
          type: 'LIMIT',
          email: 'hidden@test.com',
          accountNumber: '123456',
        },
      },
      () => {
        const attributes = buildRequestSpanAttributes({
          callContext: callContextStorage.getStore(),
          route: '/orders',
          httpStatus: 201,
        });
        expect(attributes).toBeDefined();
        expect(forbiddenKeysInAttributes(attributes!)).toEqual([]);
        expect(JSON.stringify(attributes)).not.toContain('hidden@test.com');
        expect(JSON.stringify(attributes)).not.toContain('123456');
      },
    );
  });
});
