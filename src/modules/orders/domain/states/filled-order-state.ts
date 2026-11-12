import type { OrderStatus } from '@/modules/orders/domain/entities/order.types';
import { isOrderAccepted } from '@/modules/orders/domain/validators/order-acceptance';
import type { OrderAcceptanceInput } from '@/modules/orders/domain/validators/order-acceptance';
import type { OrderState } from '@/modules/orders/domain/states/order-state';

export class FilledOrderState implements OrderState {
  readonly acceptedStatus = 'FILLED' as const;

  decide(input: OrderAcceptanceInput): OrderStatus {
    return isOrderAccepted(input) ? 'FILLED' : 'REJECTED';
  }
}
