import type {
  OrderSide,
  OrderStatus,
  OrderType,
} from '@/orders/domain/order.types';

export type OrderResponse = {
  order_id: number;
  user_id: number;
  instrument_id: number;
  side: OrderSide;
  type: OrderType;
  size: number;
  price: number;
  status: OrderStatus;
  datetime: string;
};
