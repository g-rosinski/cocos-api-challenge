import { OrderSide, OrderStatus, OrderType } from '@/domain/order-types';
import { DependencyException } from '@/common/errors/dependency.exception';
import type { OrderEntity } from '@/modules/orders/domain/entities/order.entity';
import {
  mapOrderEntityToAvailabilityOrder,
  mapOrderEntityToOrderResponse,
} from '@/modules/orders/infrastructure/mappers/order-entity.mapper';

function sampleOrder(overrides: Partial<OrderEntity> = {}): OrderEntity {
  return {
    id: 14,
    instrumentId: 47,
    userId: 1,
    size: 1,
    price: 925.85,
    type: OrderType.MARKET,
    side: OrderSide.BUY,
    status: OrderStatus.FILLED,
    datetime: new Date('2026-11-10T13:06:00.000Z'),
    ...overrides,
  };
}

describe('order-entity.mapper', () => {
  it('maps a stored order to the HTTP response shape', () => {
    expect(mapOrderEntityToOrderResponse(sampleOrder())).toEqual({
      order_id: 14,
      user_id: 1,
      instrument_id: 47,
      side: OrderSide.BUY,
      type: OrderType.MARKET,
      size: 1,
      price: 925.85,
      status: OrderStatus.FILLED,
      datetime: '2026-11-10T13:06:00',
    });
  });

  it('maps availability fields including cash movement sides', () => {
    expect(
      mapOrderEntityToAvailabilityOrder(
        sampleOrder({ side: OrderSide.CASH_IN, price: 1000 }),
      ),
    ).toMatchObject({
      instrumentId: 47,
      side: OrderSide.CASH_IN,
      price: 1000,
    });
  });

  it('rejects a non-tradable side on the HTTP response mapper', () => {
    expect(() =>
      mapOrderEntityToOrderResponse(sampleOrder({ side: OrderSide.CASH_IN })),
    ).toThrow(DependencyException);
  });

  it('rejects unknown order status', () => {
    expect(() =>
      mapOrderEntityToOrderResponse(
        sampleOrder({ status: 'PENDING' as OrderStatus }),
      ),
    ).toThrow(DependencyException);
  });

  it('rejects a non-finite price on the HTTP response', () => {
    expect(() =>
      mapOrderEntityToOrderResponse(sampleOrder({ price: Number.NaN })),
    ).toThrow(DependencyException);
  });

  it('rejects an unknown order side on availability mapping', () => {
    expect(() =>
      mapOrderEntityToAvailabilityOrder(
        sampleOrder({ side: 'HOLD' as OrderSide }),
      ),
    ).toThrow(DependencyException);
  });

  it('rejects an unknown order type on availability mapping', () => {
    expect(() =>
      mapOrderEntityToAvailabilityOrder(
        sampleOrder({ type: 'STOP' as OrderType }),
      ),
    ).toThrow(DependencyException);
  });

  it('rejects an unknown tradable side on the HTTP response', () => {
    expect(() =>
      mapOrderEntityToOrderResponse(
        sampleOrder({ side: OrderSide.CASH_OUT as OrderSide }),
      ),
    ).toThrow(DependencyException);
  });

  it('rejects an order datetime that cannot be formatted', () => {
    expect(() =>
      mapOrderEntityToOrderResponse(
        sampleOrder({ datetime: new Date('invalid') }),
      ),
    ).toThrow(DependencyException);
  });
});
