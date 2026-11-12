/**
 * Todos los sides de orden que existen en la base de datos.
 * Solo BUY y SELL son permitidos en POST /orders (ver TRADABLE_ORDER_SIDES en order.types.ts).
 */
export const ORDER_SIDES = ['BUY', 'SELL', 'CASH_IN', 'CASH_OUT'] as const;

export type OrderSide = (typeof ORDER_SIDES)[number];

/**
 * Todos los estados de orden que existen en la base de datos.
 * CANCELLED es final y reconocido al leer la cuenta; esta API no lo produce (RFC §3).
 */
export const ORDER_STATUSES = [
  'FILLED',
  'NEW',
  'REJECTED',
  'CANCELLED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
