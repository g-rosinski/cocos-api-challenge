import { PriceUnavailableException } from '@/common/errors/price-unavailable.exception';
import type {
  OrderStrategy,
  PriceResolutionInput,
} from '@/orders/strategies/order-strategy';

export class MarketOrderStrategy implements OrderStrategy {
  readonly acceptedStatus = 'FILLED' as const;

  resolvePrice(input: PriceResolutionInput): number {
    if (input.latestClose === undefined) {
      throw new PriceUnavailableException('No hay cierre disponible.');
    }
    return input.latestClose;
  }
}
