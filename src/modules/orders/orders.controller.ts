import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { getCallContext } from '@/common/correlation/call-context';
import { InternalException } from '@/common/errors/internal.exception';
import {
  createOrderBodySchema,
  createOrderValidationPipe,
  type CreateOrderBody,
} from '@/modules/orders/application/dto/create-order-body';
import { CreateOrderService } from '@/modules/orders/application/services/create-order.service';
import { ApiCreateOrder } from '@/modules/orders/application/dto/orders-openapi-examples';
import {
  IdempotencyKey,
  idempotencyKeySchema,
  idempotencyKeyValidationPipe,
} from '@/modules/orders/application/dto/idempotency-key';
import type { OrderResponse } from '@/modules/orders/application/dto/order-response.types';

@Controller('orders')
export class OrdersController {
  constructor(private readonly createOrderService: CreateOrderService) {}

  @ApiCreateOrder()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @IdempotencyKey({
      schema: idempotencyKeySchema,
      pipes: [idempotencyKeyValidationPipe],
    })
    idempotencyKey: string,
    @Body({
      schema: createOrderBodySchema,
      pipes: [createOrderValidationPipe],
    })
    body: CreateOrderBody,
  ): Promise<OrderResponse> {
    const userId = getCallContext()?.userId;
    if (userId === undefined) {
      throw new InternalException();
    }
    const callContext = getCallContext();
    if (callContext !== undefined) {
      callContext.title = 'CreateOrder';
      callContext.attributes = {
        instrument_id: body.instrument_id,
        side: body.side,
        type: body.type,
      };
    }
    const order = await this.createOrderService.create(
      userId,
      idempotencyKey,
      body,
    );
    const updated = getCallContext();
    if (updated !== undefined) {
      updated.status = order.status;
      updated.attributes = {
        ...(updated.attributes ?? {}),
        order_id: order.order_id,
        side: order.side,
        type: order.type,
      };
    }
    return order;
  }
}
