import { Injectable } from '@nestjs/common';
import { IllegalOrderTransitionError } from '@/modules/orders/domain/illegal-order-transition.error';
import type { OrderType } from '@/modules/orders/domain/entities/order.types';
import { LimitOrderStrategy } from '@/modules/orders/domain/strategies/limit-order.strategy';
import { MarketOrderStrategy } from '@/modules/orders/domain/strategies/market-order.strategy';
import type { OrderStrategy } from '@/modules/orders/domain/strategies/order-strategy';

@Injectable()
export class OrderStrategyFactory {
  create(type: OrderType): OrderStrategy {
    switch (type) {
      case 'MARKET':
        return new MarketOrderStrategy();
      case 'LIMIT':
        return new LimitOrderStrategy();
      default: {
        const unexpected: never = type;
        throw new IllegalOrderTransitionError(String(unexpected));
      }
    }
  }
}
