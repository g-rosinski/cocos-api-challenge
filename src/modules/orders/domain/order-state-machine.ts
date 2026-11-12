import type { OrderStatus } from '@/modules/orders/domain/entities/order.types';
import type { OrderState } from '@/modules/orders/domain/states/order-state';
import type { OrderAcceptanceInput } from '@/modules/orders/domain/validators/order-acceptance';

export class OrderStateMachine {
  decide(state: OrderState, input: OrderAcceptanceInput): OrderStatus {
    return state.decide(input);
  }
}
