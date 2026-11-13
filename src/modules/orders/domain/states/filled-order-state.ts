import {
  OrderStatus,
  type OrderStatus as OrderStatusType,
} from '@/domain/order-types';
import { isOrderAccepted } from '@/modules/orders/domain/validators/order-acceptance';
import type { OrderAcceptanceInput } from '@/modules/orders/domain/validators/order-acceptance';
import type { OrderState } from '@/modules/orders/domain/states/order-state';

export class FilledOrderState implements OrderState {
  readonly acceptedStatus = OrderStatus.FILLED;

  decide(input: OrderAcceptanceInput): OrderStatusType {
    return isOrderAccepted(input) ? OrderStatus.FILLED : OrderStatus.REJECTED;
  }
}
