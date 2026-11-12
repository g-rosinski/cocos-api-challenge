import { IllegalOrderTransitionError } from '@/orders/domain/illegal-order-transition.error';
import type { OrderType } from '@/orders/domain/order.types';
import { OrderStrategyFactory } from '@/orders/order-strategy.factory';

describe('OrderStrategyFactory', () => {
  const factory = new OrderStrategyFactory();

  it('returns the market strategy', () => {
    expect(factory.create('MARKET').acceptedStatus).toBe('FILLED');
  });

  it('returns the limit strategy', () => {
    expect(factory.create('LIMIT').acceptedStatus).toBe('NEW');
  });

  it('rejects an order type outside the diagram', () => {
    expect(() => factory.create('STOP' as OrderType)).toThrow(
      IllegalOrderTransitionError,
    );
  });
});
