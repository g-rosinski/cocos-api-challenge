import { Injectable } from '@nestjs/common';
import { IllegalOrderTransitionError } from '@/orders/domain/illegal-order-transition.error';
import type { OrderType } from '@/orders/domain/order.types';
import { LimitOrderStrategy } from '@/orders/strategies/limit-order.strategy';
import { MarketOrderStrategy } from '@/orders/strategies/market-order.strategy';
import type { OrderStrategy } from '@/orders/strategies/order-strategy';

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
