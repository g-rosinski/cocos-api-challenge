import {
  filledCashDeltaCents,
  openBuyReserveCents,
} from '@/ledger/cash-movement';

export type AvailabilityOrder = {
  instrumentId: number;
  size: number;
  price: number;
  side: string;
  status: string;
  type: string;
};

export type TradingAvailability = {
  availableCash: number;
  availableShares: number;
};

function isCashMovement(side: string): boolean {
  return side === 'CASH_IN' || side === 'CASH_OUT';
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
    if (order.status === 'FILLED') {
      if (order.instrumentId === instrumentId && !isCashMovement(order.side)) {
        if (order.side === 'BUY') {
          settledShares += order.size;
        } else if (order.side === 'SELL') {
          settledShares -= order.size;
        }
      }
    }
    if (
      order.status === 'NEW' &&
      order.type === 'LIMIT' &&
      order.side === 'SELL' &&
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
