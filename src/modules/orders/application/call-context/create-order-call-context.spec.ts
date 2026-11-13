import type { CreateOrderBody } from '@/modules/orders/application/dto/create-order-body';
import type { OrderResponse } from '@/modules/orders/application/dto/order-response.types';
import {
  applyCreateOrderRequestCallContext,
  applyCreateOrderSuccessCallContext,
} from '@/modules/orders/application/call-context/create-order-call-context';

describe('create-order call context', () => {
  const body: CreateOrderBody = {
    instrument_id: 47,
    side: 'BUY',
    type: 'MARKET',
    size: 1,
  };

  const order: OrderResponse = {
    order_id: 14,
    user_id: 1,
    instrument_id: 47,
    side: 'BUY',
    type: 'MARKET',
    size: 1,
    price: 925.85,
    status: 'FILLED',
    datetime: '2026-11-10T13:06:00',
  };

  it('does nothing when context is undefined on request', () => {
    expect(() =>
      applyCreateOrderRequestCallContext(undefined, body),
    ).not.toThrow();
  });

  it('sets title and request attributes', () => {
    const context = { correlationId: 'corr-1', userId: 1 };
    applyCreateOrderRequestCallContext(context, body);
    expect(context.title).toBe('CreateOrder');
    expect(context.attributes).toEqual({
      instrument_id: 47,
      side: 'BUY',
      type: 'MARKET',
    });
  });

  it('does nothing when context is undefined on success', () => {
    expect(() =>
      applyCreateOrderSuccessCallContext(undefined, order),
    ).not.toThrow();
  });

  it('sets status and merges order attributes', () => {
    const context = {
      correlationId: 'corr-1',
      userId: 1,
      attributes: {
        instrument_id: 47,
        side: 'BUY',
        type: 'MARKET',
      },
    };
    applyCreateOrderSuccessCallContext(context, order);
    expect(context.status).toBe('FILLED');
    expect(context.attributes).toEqual({
      instrument_id: 47,
      side: 'BUY',
      type: 'MARKET',
      order_id: 14,
    });
  });

  it('sets order fields when attributes were not set on request', () => {
    const context = { correlationId: 'corr-2', userId: 1 };
    applyCreateOrderSuccessCallContext(context, order);
    expect(context).toMatchObject({
      status: 'FILLED',
      attributes: {
        order_id: 14,
        side: 'BUY',
        type: 'MARKET',
      },
    });
  });
});
