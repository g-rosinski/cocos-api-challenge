import type {
  AcceptedOrderStatus,
  OrderStatus,
} from '@/modules/orders/domain/entities/order.types';
import type { OrderAcceptanceInput } from '@/modules/orders/domain/validators/order-acceptance';

export type OrderState = {
  readonly acceptedStatus: AcceptedOrderStatus;
  decide(input: OrderAcceptanceInput): OrderStatus;
};
