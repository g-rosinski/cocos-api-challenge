import { PriceUnavailableException } from '../../common/errors/price-unavailable.exception.js';
import { MarketOrderStrategy } from './market-order.strategy.js';

describe('MarketOrderStrategy', () => {
  const strategy = new MarketOrderStrategy();

  it('accepts at the latest close and fills the order', () => {
    expect(strategy.acceptedStatus).toBe('FILLED');
    expect(strategy.resolvePrice({ latestClose: 925.85 })).toBe(925.85);
  });

  it('fails when the close the order needs is missing', () => {
    expect(() => strategy.resolvePrice({})).toThrow(PriceUnavailableException);
  });
});
