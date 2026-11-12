import { Injectable } from '@nestjs/common';
import { IllegalOrderTransitionError } from '@/orders/domain/illegal-order-transition.error';
import { isOrderAccepted } from '@/orders/domain/order-acceptance';
import type { OrderSide, OrderStatus } from '@/orders/domain/order.types';

export type OrderDecisionInput = {
  acceptedStatus: string;
  side: OrderSide;
  size: number;
  price: number;
  availableCash: number;
  availableShares: number;
};

@Injectable()
export class OrderStateMachine {
  decide(input: OrderDecisionInput): OrderStatus {
    if (input.acceptedStatus !== 'FILLED' && input.acceptedStatus !== 'NEW') {
      throw new IllegalOrderTransitionError(input.acceptedStatus);
    }
    if (!isOrderAccepted(input)) {
      return 'REJECTED';
    }
    return input.acceptedStatus;
  }
}
