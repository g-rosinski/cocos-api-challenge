import type { AvailabilityOrder } from '../domain/trading-availability.js';
import type {
  OrderSide,
  OrderStatus,
  OrderType,
} from '../domain/order.types.js';
import type { OrderResponse } from '../order-response.types.js';

export const ORDER_TRANSACTION = Symbol('ORDER_TRANSACTION');

export type StoredIdempotency = {
  payloadHash: string;
  order: OrderResponse;
};

export type TradableInstrument = {
  id: number;
  type: string;
};

export type NewOrderRecord = {
  userId: number;
  instrumentId: number;
  side: OrderSide;
  type: OrderType;
  size: number;
  price: number;
  status: OrderStatus;
};

export type NewIdempotencyRecord = {
  userId: number;
  idempotencyKey: string;
  orderId: number;
  payloadHash: string;
};

export type LockedOrderContext = {
  findIdempotency(
    userId: number,
    idempotencyKey: string,
  ): Promise<StoredIdempotency | null>;
  loadInstrument(instrumentId: number): Promise<TradableInstrument | null>;
  loadLatestClose(instrumentId: number): Promise<number | null>;
  loadOrders(userId: number): Promise<AvailabilityOrder[]>;
  insertOrder(order: NewOrderRecord): Promise<OrderResponse>;
  insertIdempotency(record: NewIdempotencyRecord): Promise<void>;
};

export type OrderTransactionPort = {
  findIdempotency(
    userId: number,
    idempotencyKey: string,
  ): Promise<StoredIdempotency | null>;
  runInTransaction<T>(
    userId: number,
    work: (context: LockedOrderContext) => Promise<T>,
  ): Promise<T>;
};
