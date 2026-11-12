import { OrderSide, OrderStatus, OrderType } from '@/domain/order-types';
import type {
  OrderSide as OrderSideType,
  OrderStatus as OrderStatusType,
} from '@/domain/order-types';

export function toCents(value: number): number {
  return Math.round(value * 100);
}

type CashDeltaOrder = {
  side: OrderSideType;
  status: OrderStatusType;
  size: number;
  price: number;
};

type ReserveOrder = CashDeltaOrder & {
  type: string;
};

export function filledCashDeltaCents(order: CashDeltaOrder): number {
  if (order.status !== OrderStatus.FILLED) {
    return 0;
  }
  const amount = order.size * toCents(order.price);
  if (order.side === OrderSide.CASH_IN || order.side === OrderSide.SELL) {
    return amount;
  }
  if (order.side === OrderSide.CASH_OUT || order.side === OrderSide.BUY) {
    return -amount;
  }
  return 0;
}

export function openBuyReserveCents(order: ReserveOrder): number {
  if (
    order.status === OrderStatus.NEW &&
    order.type === OrderType.LIMIT &&
    order.side === OrderSide.BUY
  ) {
    return order.size * toCents(order.price);
  }
  return 0;
}
