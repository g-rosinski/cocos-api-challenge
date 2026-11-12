import { calculatePortfolio } from '@/modules/portfolio/domain/portfolio-calculator';
import type { PortfolioOrderInput } from '@/modules/portfolio/domain/entities/portfolio-input.types';
import { calculateTradingAvailability } from '@/modules/orders/domain/validators/trading-availability';
import type { AvailabilityOrder } from '@/modules/orders/domain/validators/trading-availability';

function order(
  overrides: Partial<AvailabilityOrder> &
    Pick<AvailabilityOrder, 'side' | 'status'>,
): AvailabilityOrder {
  return {
    instrumentId: 47,
    size: 1,
    price: 100,
    type: 'MARKET',
    ...overrides,
  };
}

describe('calculateTradingAvailability', () => {
  it('subtracts filled buys and open limit buys from cash', () => {
    const availability = calculateTradingAvailability(
      [
        order({
          side: 'CASH_IN',
          status: 'FILLED',
          size: 1000,
          price: 1,
          instrumentId: 66,
        }),
        order({ side: 'BUY', status: 'FILLED', size: 1, price: 100 }),
        order({
          side: 'BUY',
          status: 'NEW',
          type: 'LIMIT',
          size: 2,
          price: 50,
          instrumentId: 45,
        }),
        order({
          side: 'CASH_OUT',
          status: 'FILLED',
          size: 20,
          price: 1,
          instrumentId: 66,
        }),
      ],
      47,
    );

    expect(availability.availableCash).toBe(780);
    expect(availability.availableShares).toBe(1);
  });

  it('reserves shares from an open limit sell and ignores rejected or cancelled orders', () => {
    const availability = calculateTradingAvailability(
      [
        order({ side: 'BUY', status: 'FILLED', size: 40, price: 930 }),
        order({ side: 'SELL', status: 'FILLED', size: 2, price: 900 }),
        order({
          side: 'SELL',
          status: 'NEW',
          type: 'LIMIT',
          size: 5,
          price: 1000,
        }),
        order({ side: 'SELL', status: 'REJECTED', size: 1000, price: 925.85 }),
        order({ side: 'SELL', status: 'CANCELLED', size: 10, price: 900 }),
        order({
          side: 'HOLD' as unknown as AvailabilityOrder['side'],
          status: 'FILLED',
          size: 1,
          price: 10,
        }),
        order({
          side: 'SELL',
          status: 'FILLED',
          size: 4,
          price: 900,
          instrumentId: 31,
        }),
      ],
      47,
    );

    expect(availability.availableShares).toBe(33);
    expect(availability.availableCash).toBe(-40 * 930 + 2 * 900 + 4 * 900);
  });

  it('matches portfolio cash balance when prices have decimals', () => {
    const history: PortfolioOrderInput[] = [
      {
        instrumentId: 66,
        size: 1000,
        price: 1,
        side: 'CASH_IN',
        status: 'FILLED',
        type: 'MARKET',
      },
      {
        instrumentId: 47,
        size: 1,
        price: 10.33,
        side: 'BUY',
        status: 'FILLED',
        type: 'MARKET',
      },
      {
        instrumentId: 45,
        size: 1,
        price: 710.15,
        side: 'BUY',
        status: 'NEW',
        type: 'LIMIT',
      },
    ];
    const availability = calculateTradingAvailability(history, 47);
    const portfolio = calculatePortfolio({
      orders: history,
      instruments: [
        { id: 66, ticker: 'ARS', name: 'PESOS', type: 'MONEDA' },
        { id: 47, ticker: 'PAMP', name: 'Pampa', type: 'ACCIONES' },
        { id: 45, ticker: 'LOMA', name: 'Loma', type: 'ACCIONES' },
      ],
      latestCloses: new Map([[47, 10.33]]),
    });
    expect(availability.availableCash).toBe(portfolio.summary.cash_balance);
  });
});
