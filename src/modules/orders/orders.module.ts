import { Module } from '@nestjs/common';
import { TypeOrmOrderTransactionAdapter } from '@/modules/orders/infrastructure/repositories/typeorm-order-transaction.adapter';
import { CreateOrderService } from '@/modules/orders/application/services/create-order.service';
import { OrderStateMachine } from '@/modules/orders/domain/order-state-machine';
import { OrdersController } from '@/modules/orders/orders.controller';
import { OrderStrategyFactory } from '@/modules/orders/domain/order-strategy.factory';
import { ORDER_TRANSACTION } from '@/modules/orders/application/ports/order-transaction.port';

@Module({
  controllers: [OrdersController],
  providers: [
    CreateOrderService,
    OrderStrategyFactory,
    { provide: OrderStateMachine, useValue: new OrderStateMachine() },
    TypeOrmOrderTransactionAdapter,
    {
      provide: ORDER_TRANSACTION,
      useExisting: TypeOrmOrderTransactionAdapter,
    },
  ],
})
export class OrdersModule {}
