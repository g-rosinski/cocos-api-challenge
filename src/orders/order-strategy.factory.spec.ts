import { IllegalOrderTransitionError } from './domain/illegal-order-transition.error.js';
import type { OrderType } from './domain/order.types.js';
import { OrderStrategyFactory } from './order-strategy.factory.js';

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
