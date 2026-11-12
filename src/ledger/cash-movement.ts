export function toCents(value: number): number {
  return Math.round(value * 100);
}

type CashDeltaOrder = {
  side: string;
  status: string;
  size: number;
  price: number;
};

type ReserveOrder = CashDeltaOrder & {
  type: string;
};

export function filledCashDeltaCents(order: CashDeltaOrder): number {
  if (order.status !== 'FILLED') {
    return 0;
  }
  const amount = order.size * toCents(order.price);
  if (order.side === 'CASH_IN' || order.side === 'SELL') {
    return amount;
  }
  if (order.side === 'CASH_OUT' || order.side === 'BUY') {
    return -amount;
  }
  return 0;
}

export function openBuyReserveCents(order: ReserveOrder): number {
  if (
    order.status === 'NEW' &&
    order.type === 'LIMIT' &&
    order.side === 'BUY'
  ) {
    return order.size * toCents(order.price);
  }
  return 0;
}
