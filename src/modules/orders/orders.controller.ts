import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { getCallContext } from '@/common/correlation/call-context';
import { requireCallContextUserId } from '@/common/correlation/require-call-context-user-id';
import {
  applyCreateOrderRequestCallContext,
  applyCreateOrderSuccessCallContext,
} from '@/modules/orders/application/call-context/create-order-call-context';
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
    const userId = requireCallContextUserId(getCallContext());
    applyCreateOrderRequestCallContext(getCallContext(), body);
    const order = await this.createOrderService.create(
      userId,
      idempotencyKey,
      body,
    );
    applyCreateOrderSuccessCallContext(getCallContext(), order);
    return order;
  }
}
