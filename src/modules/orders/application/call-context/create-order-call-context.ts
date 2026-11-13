import type { CallContext } from '@/common/logging/call-context/call-context';
import type { CreateOrderBody } from '@/modules/orders/application/dto/create-order-body';
import type { OrderResponse } from '@/modules/orders/application/dto/order-response.types';

export function applyCreateOrderRequestCallContext(
  context: CallContext | undefined,
  body: CreateOrderBody,
): void {
  if (context === undefined) {
    return;
  }
  context.title = 'CreateOrder';
  context.attributes = {
    instrument_id: body.instrument_id,
    side: body.side,
    type: body.type,
  };
}

export function applyCreateOrderSuccessCallContext(
  context: CallContext | undefined,
  order: OrderResponse,
): void {
  if (context === undefined) {
    return;
  }
  context.status = order.status;
  context.attributes = {
    ...(context.attributes ?? {}),
    order_id: order.order_id,
    side: order.side,
    type: order.type,
  };
}
