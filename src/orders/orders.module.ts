import { Module } from '@nestjs/common';
import { TypeOrmOrderTransactionAdapter } from './adapters/typeorm-order-transaction.adapter.js';
import { CreateOrderService } from './create-order.service.js';
import { OrderStateMachine } from './domain/order-state-machine.js';
import { OrdersController } from './orders.controller.js';
import { OrderStrategyFactory } from './order-strategy.factory.js';
import { ORDER_TRANSACTION } from './ports/order-transaction.port.js';

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
