import { OrderStatus, OrderType } from '@/domain/order-types';
import { IllegalOrderTransitionError } from '@/modules/orders/domain/illegal-order-transition.error';
import type { OrderType as OrderTypeName } from '@/modules/orders/domain/entities/order.types';
import { OrderStrategyFactory } from '@/modules/orders/domain/order-strategy.factory';

describe('OrderStrategyFactory', () => {
  const factory = new OrderStrategyFactory();

  it('returns the market strategy', () => {
    expect(factory.create(OrderType.MARKET).state.acceptedStatus).toBe(
      OrderStatus.FILLED,
    );
  });

  it('returns the limit strategy', () => {
    expect(factory.create(OrderType.LIMIT).state.acceptedStatus).toBe(
      OrderStatus.NEW,
    );
  });

  it('rejects an order type outside the diagram', () => {
    expect(() => factory.create('STOP' as OrderTypeName)).toThrow(
      IllegalOrderTransitionError,
    );
  });
});
