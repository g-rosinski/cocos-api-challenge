import { resolveOrderSize } from '@/modules/orders/domain/resolve-order-size';

describe('resolveOrderSize', () => {
  it('keeps an explicit size', () => {
    expect(resolveOrderSize({ size: 3, price: 10 })).toBe(3);
  });

  it('takes the largest whole number of shares an amount can buy', () => {
    expect(resolveOrderSize({ amount: 1000, price: 925.85 })).toBe(1);
  });

  it('returns zero when the amount does not cover one share', () => {
    expect(resolveOrderSize({ amount: 100, price: 925.85 })).toBe(0);
  });

  it('returns zero when the price is not positive', () => {
    expect(resolveOrderSize({ amount: 100, price: 0 })).toBe(0);
  });

  it('returns zero when neither size nor amount is present', () => {
    expect(resolveOrderSize({ price: 10 })).toBe(0);
  });
});
