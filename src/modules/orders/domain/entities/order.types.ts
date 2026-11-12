import type { OrderSide, OrderStatus } from '@/domain/order-types';

export {
  ORDER_SIDES,
  ORDER_STATUSES,
  type OrderSide,
  type OrderStatus,
} from '@/domain/order-types';

/** Sides permitidos en POST /orders. */
export const TRADABLE_ORDER_SIDES = [
  'BUY',
  'SELL',
] as const satisfies readonly OrderSide[];

export type TradableOrderSide = (typeof TRADABLE_ORDER_SIDES)[number];

/** Movimientos de caja reconocidos al armar portfolio y disponibilidad. */
export const CASH_MOVEMENT_SIDES = [
  'CASH_IN',
  'CASH_OUT',
] as const satisfies readonly OrderSide[];

export type CashMovementSide = (typeof CASH_MOVEMENT_SIDES)[number];

export const ORDER_TYPES = ['MARKET', 'LIMIT'] as const;

export type OrderType = (typeof ORDER_TYPES)[number];

export type AcceptedOrderStatus = Extract<OrderStatus, 'FILLED' | 'NEW'>;
