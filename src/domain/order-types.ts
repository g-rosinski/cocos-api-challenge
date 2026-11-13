/**
 * Todos los sides de orden que existen en la base de datos.
 * Solo BUY y SELL son permitidos en POST /orders (ver TRADABLE_ORDER_SIDES en order.types.ts).
 */
export const OrderSide = {
  BUY: 'BUY',
  SELL: 'SELL',
  CASH_IN: 'CASH_IN',
  CASH_OUT: 'CASH_OUT',
} as const;

export type OrderSide = (typeof OrderSide)[keyof typeof OrderSide];

export const ORDER_SIDES = [
  OrderSide.BUY,
  OrderSide.SELL,
  OrderSide.CASH_IN,
  OrderSide.CASH_OUT,
] as const satisfies readonly OrderSide[];

/**
 * Todos los estados de orden que existen en la base de datos.
 * CANCELLED es final y reconocido al leer la cuenta; esta API no lo produce (RFC §3).
 */
export const OrderStatus = {
  FILLED: 'FILLED',
  NEW: 'NEW',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const ORDER_STATUSES = [
  OrderStatus.FILLED,
  OrderStatus.NEW,
  OrderStatus.REJECTED,
  OrderStatus.CANCELLED,
] as const satisfies readonly OrderStatus[];

export const OrderType = {
  MARKET: 'MARKET',
  LIMIT: 'LIMIT',
} as const;

export type OrderType = (typeof OrderType)[keyof typeof OrderType];

export const ORDER_TYPES = [
  OrderType.MARKET,
  OrderType.LIMIT,
] as const satisfies readonly OrderType[];

export function isKnownOrderSide(value: string): value is OrderSide {
  return (ORDER_SIDES as readonly string[]).includes(value);
}

export function isKnownOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function isKnownOrderType(value: string): value is OrderType {
  return (ORDER_TYPES as readonly string[]).includes(value);
}
