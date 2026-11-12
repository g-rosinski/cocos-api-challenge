import { IllegalOrderTransitionError } from '@/modules/orders/domain/illegal-order-transition.error';
import type { OrderType } from '@/modules/orders/domain/entities/order.types';
import { OrderStrategyFactory } from '@/modules/orders/domain/order-strategy.factory';

describe('OrderStrategyFactory', () => {
  const factory = new OrderStrategyFactory();

  it('returns the market strategy', () => {
    expect(factory.create('MARKET').state.acceptedStatus).toBe('FILLED');
  });

  it('returns the limit strategy', () => {
    expect(factory.create('LIMIT').state.acceptedStatus).toBe('NEW');
  });

  it('rejects an order type outside the diagram', () => {
    expect(() => factory.create('STOP' as OrderType)).toThrow(
      IllegalOrderTransitionError,
    );
  });
});
