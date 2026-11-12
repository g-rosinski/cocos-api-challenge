import { ValidationException } from '@/common/errors/validation.exception';
import type {
  OrderStrategy,
  PriceResolutionInput,
} from '@/orders/strategies/order-strategy';

export class LimitOrderStrategy implements OrderStrategy {
  readonly acceptedStatus = 'NEW' as const;

  resolvePrice(input: PriceResolutionInput): number {
    if (input.requestedPrice === undefined) {
      throw new ValidationException();
    }
    return input.requestedPrice;
  }
}
