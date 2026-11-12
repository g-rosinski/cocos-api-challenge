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

function toCents(value: number): number {
  return Math.round(value * 100);
}

function isCashMovement(side: string): boolean {
  return side === 'CASH_IN' || side === 'CASH_OUT';
}

function tradeCents(order: AvailabilityOrder): number {
  return order.size * toCents(order.price);
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
    if (order.status === 'FILLED') {
      const amountCents = tradeCents(order);
      if (order.side === 'CASH_IN' || order.side === 'SELL') {
        settledCashCents += amountCents;
      } else if (order.side === 'CASH_OUT' || order.side === 'BUY') {
        settledCashCents -= amountCents;
      }
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
      order.side === 'BUY'
    ) {
      reservedCashCents += tradeCents(order);
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
