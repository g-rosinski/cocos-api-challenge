import { ValidationException } from '@/common/errors/validation.exception';
import { NewOrderState } from '@/modules/orders/domain/states/new-order-state';
import type {
  OrderStrategy,
  PriceResolutionInput,
} from '@/modules/orders/domain/strategies/order-strategy';

export class LimitOrderStrategy implements OrderStrategy {
  readonly state = new NewOrderState();

  resolvePrice(input: PriceResolutionInput): number {
    if (input.requestedPrice === undefined) {
      throw new ValidationException();
    }
    return input.requestedPrice;
  }
}
