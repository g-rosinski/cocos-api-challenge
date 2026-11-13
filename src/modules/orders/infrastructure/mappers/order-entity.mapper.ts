import { DependencyException } from '@/common/errors/dependency.exception';
import {
  isKnownOrderSide,
  isKnownOrderStatus,
  isKnownOrderType,
  OrderSide,
} from '@/domain/order-types';
import type { TradableOrderSide } from '@/modules/orders/domain/entities/order.types';
import type { OrderEntity } from '@/modules/orders/domain/entities/order.entity';
import { formatOrderDatetime } from '@/modules/orders/domain/format-order-datetime';
import type { OrderResponse } from '@/modules/orders/application/dto/order-response.types';
import type { AvailabilityOrder } from '@/modules/orders/domain/validators/trading-availability';

function readMoney(value: number): number {
  if (!Number.isFinite(value)) {
    throw new DependencyException(value);
  }
  return Math.round(value * 100) / 100;
}

function readTradableOrderSide(value: string): TradableOrderSide {
  if (value === OrderSide.BUY || value === OrderSide.SELL) {
    return value;
  }
  throw new DependencyException(value);
}

function readOrderSide(value: string) {
  if (isKnownOrderSide(value)) {
    return value;
  }
  throw new DependencyException(value);
}

function readOrderType(value: string) {
  if (isKnownOrderType(value)) {
    return value;
  }
  throw new DependencyException(value);
}

function readOrderStatus(value: string) {
  if (isKnownOrderStatus(value)) {
    return value;
  }
  throw new DependencyException(value);
}

function readDatetime(value: Date): string {
  const formatted = formatOrderDatetime(value);
  if (formatted === null) {
    throw new DependencyException(value);
  }
  return formatted;
}

export function mapOrderEntityToOrderResponse(
  entity: OrderEntity,
): OrderResponse {
  return {
    order_id: entity.id,
    user_id: entity.userId,
    instrument_id: entity.instrumentId,
    side: readTradableOrderSide(entity.side),
    type: readOrderType(entity.type),
    size: entity.size,
    price: readMoney(entity.price),
    status: readOrderStatus(entity.status),
    datetime: readDatetime(entity.datetime),
  };
}

export function mapOrderEntityToAvailabilityOrder(
  entity: OrderEntity,
): AvailabilityOrder {
  return {
    instrumentId: entity.instrumentId,
    size: entity.size,
    price: readMoney(entity.price),
    side: readOrderSide(entity.side),
    status: readOrderStatus(entity.status),
    type: readOrderType(entity.type),
  };
}
