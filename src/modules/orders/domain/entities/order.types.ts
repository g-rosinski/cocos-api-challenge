import { OrderSide, OrderStatus } from '@/domain/order-types';
import type {
  OrderSide as OrderSideType,
  OrderStatus as OrderStatusType,
} from '@/domain/order-types';

export * from '@/domain/order-types';

/** Sides permitidos en POST /orders. */
export const TRADABLE_ORDER_SIDES = [
  OrderSide.BUY,
  OrderSide.SELL,
] as const satisfies readonly OrderSideType[];

export type TradableOrderSide = (typeof TRADABLE_ORDER_SIDES)[number];

/** Movimientos de caja reconocidos al armar portfolio y disponibilidad. */
export const CASH_MOVEMENT_SIDES = [
  OrderSide.CASH_IN,
  OrderSide.CASH_OUT,
] as const satisfies readonly OrderSideType[];

export type CashMovementSide = (typeof CASH_MOVEMENT_SIDES)[number];

export type AcceptedOrderStatus = Extract<
  OrderStatusType,
  typeof OrderStatus.FILLED | typeof OrderStatus.NEW
>;
