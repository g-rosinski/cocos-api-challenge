import { Module } from '@nestjs/common';
import { TypeOrmOrderTransactionAdapter } from '@/orders/adapters/typeorm-order-transaction.adapter';
import { CreateOrderService } from '@/orders/create-order.service';
import { OrderStateMachine } from '@/orders/domain/order-state-machine';
import { OrdersController } from '@/orders/orders.controller';
import { OrderStrategyFactory } from '@/orders/order-strategy.factory';
import { ORDER_TRANSACTION } from '@/orders/ports/order-transaction.port';

@Module({
  controllers: [OrdersController],
  providers: [
    CreateOrderService,
    OrderStrategyFactory,
    OrderStateMachine,
    TypeOrmOrderTransactionAdapter,
    {
      provide: ORDER_TRANSACTION,
      useExisting: TypeOrmOrderTransactionAdapter,
    },
  ],
})
export class OrdersModule {}
