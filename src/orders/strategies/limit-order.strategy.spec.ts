import { ValidationException } from '@/common/errors/validation.exception';
import { LimitOrderStrategy } from '@/orders/strategies/limit-order.strategy';

describe('LimitOrderStrategy', () => {
  const strategy = new LimitOrderStrategy();

  it('accepts the investor price and leaves the order open', () => {
    expect(strategy.acceptedStatus).toBe('NEW');
    expect(
      strategy.resolvePrice({ requestedPrice: 710, latestClose: 925.85 }),
    ).toBe(710);
  });

  it('fails when the limit price is missing', () => {
    expect(() => strategy.resolvePrice({ latestClose: 925.85 })).toThrow(
      ValidationException,
    );
  });
});
