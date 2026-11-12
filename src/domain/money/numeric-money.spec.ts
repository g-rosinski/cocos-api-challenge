import { numericMoneyTransformer } from '@/domain/money/numeric-money';

describe('numericMoneyTransformer', () => {
  it('rounds money values to two decimals on read', () => {
    expect(numericMoneyTransformer.from('10.555')).toBe(10.56);
    expect(numericMoneyTransformer.from(925.849)).toBe(925.85);
  });

  it('returns NaN when the value is not finite', () => {
    expect(numericMoneyTransformer.from('invalid')).toBeNaN();
  });

  it('passes numbers through on write', () => {
    expect(numericMoneyTransformer.to(100.5)).toBe(100.5);
  });
});
