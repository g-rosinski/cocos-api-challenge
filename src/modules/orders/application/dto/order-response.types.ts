import type {
  OrderStatus,
  OrderType,
  TradableOrderSide,
} from '@/modules/orders/domain/entities/order.types';

export type OrderResponse = {
  order_id: number;
  user_id: number;
  instrument_id: number;
  side: TradableOrderSide;
  type: OrderType;
  size: number;
  price: number;
  status: OrderStatus;
  datetime: string;
};
