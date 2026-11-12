import { ValidationException } from '../../common/errors/validation.exception.js';
import type { OrderStrategy, PriceResolutionInput } from './order-strategy.js';

export class LimitOrderStrategy implements OrderStrategy {
  readonly acceptedStatus = 'NEW' as const;

  resolvePrice(input: PriceResolutionInput): number {
    if (input.requestedPrice === undefined) {
      throw new ValidationException();
    }
    return input.requestedPrice;
  }
}
