import { Injectable } from '@nestjs/common';
import { IllegalOrderTransitionError } from './illegal-order-transition.error.js';
import { isOrderAccepted } from './order-acceptance.js';
import type { OrderSide, OrderStatus } from './order.types.js';

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
