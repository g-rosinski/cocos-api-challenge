import { Injectable } from '@nestjs/common';
import { IllegalOrderTransitionError } from './domain/illegal-order-transition.error.js';
import type { OrderType } from './domain/order.types.js';
import { LimitOrderStrategy } from './strategies/limit-order.strategy.js';
import { MarketOrderStrategy } from './strategies/market-order.strategy.js';
import type { OrderStrategy } from './strategies/order-strategy.js';

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
