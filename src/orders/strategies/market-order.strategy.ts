import { PriceUnavailableException } from '../../common/errors/price-unavailable.exception.js';
import type { OrderStrategy, PriceResolutionInput } from './order-strategy.js';

export class MarketOrderStrategy implements OrderStrategy {
  readonly acceptedStatus = 'FILLED' as const;

  resolvePrice(input: PriceResolutionInput): number {
    if (input.latestClose === undefined) {
      throw new PriceUnavailableException('No hay cierre disponible.');
    }
    return input.latestClose;
  }
}
