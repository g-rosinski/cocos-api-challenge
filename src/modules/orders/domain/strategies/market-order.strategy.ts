import { PriceUnavailableException } from '@/common/errors/price-unavailable.exception';
import { FilledOrderState } from '@/modules/orders/domain/states/filled-order-state';
import type {
  OrderStrategy,
  PriceResolutionInput,
} from '@/modules/orders/domain/strategies/order-strategy';

export class MarketOrderStrategy implements OrderStrategy {
  readonly state = new FilledOrderState();

  resolvePrice(input: PriceResolutionInput): number {
    if (input.latestClose === undefined) {
      throw new PriceUnavailableException('No hay cierre disponible.');
    }
    return input.latestClose;
  }
}
