import {
  OrderSide,
  OrderStatus,
  OrderType,
  type OrderSide as OrderSideType,
  type OrderStatus as OrderStatusType,
} from '@/domain/order-types';
import {
  filledCashDeltaCents,
  openBuyReserveCents,
} from '@/domain/ledger/cash-movement';
import { CASH_MOVEMENT_SIDES } from '@/modules/orders/domain/entities/order.types';

export type AvailabilityOrder = {
  instrumentId: number;
  size: number;
  price: number;
  side: OrderSideType;
  status: OrderStatusType;
  type: string;
};

export type TradingAvailability = {
  availableCash: number;
  availableShares: number;
};

function isCashMovement(side: OrderSideType): boolean {
  return (CASH_MOVEMENT_SIDES as readonly OrderSideType[]).includes(side);
}

export function calculateTradingAvailability(
  orders: readonly AvailabilityOrder[],
  instrumentId: number,
): TradingAvailability {
  let settledCashCents = 0;
  let reservedCashCents = 0;
  let settledShares = 0;
  let reservedShares = 0;

  for (const order of orders) {
    settledCashCents += filledCashDeltaCents(order);
    reservedCashCents += openBuyReserveCents(order);
    if (order.status === OrderStatus.FILLED) {
      if (order.instrumentId === instrumentId && !isCashMovement(order.side)) {
        if (order.side === OrderSide.BUY) {
          settledShares += order.size;
        } else if (order.side === OrderSide.SELL) {
          settledShares -= order.size;
        }
      }
    }
    if (
      order.status === OrderStatus.NEW &&
      order.type === OrderType.LIMIT &&
      order.side === OrderSide.SELL &&
      order.instrumentId === instrumentId
    ) {
      reservedShares += order.size;
    }
  }

  return {
    availableCash: (settledCashCents - reservedCashCents) / 100,
    availableShares: settledShares - reservedShares,
  };
}
