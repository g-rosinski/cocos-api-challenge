import { calculatePortfolio } from '@/modules/portfolio/domain/portfolio-calculator';
import { OrderSide, OrderStatus, OrderType } from '@/domain/order-types';
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
    type: OrderType.MARKET,
    ...overrides,
  };
}

describe('calculateTradingAvailability', () => {
  it('subtracts filled buys and open limit buys from cash', () => {
    const availability = calculateTradingAvailability(
      [
        order({
          side: OrderSide.CASH_IN,
          status: OrderStatus.FILLED,
          size: 1000,
          price: 1,
          instrumentId: 66,
        }),
        order({
          side: OrderSide.BUY,
          status: OrderStatus.FILLED,
          size: 1,
          price: 100,
        }),
        order({
          side: OrderSide.BUY,
          status: OrderStatus.NEW,
          type: OrderType.LIMIT,
          size: 2,
          price: 50,
          instrumentId: 45,
        }),
        order({
          side: OrderSide.CASH_OUT,
          status: OrderStatus.FILLED,
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
        order({
          side: OrderSide.BUY,
          status: OrderStatus.FILLED,
          size: 40,
          price: 930,
        }),
        order({
          side: OrderSide.SELL,
          status: OrderStatus.FILLED,
          size: 2,
          price: 900,
        }),
        order({
          side: OrderSide.SELL,
          status: OrderStatus.NEW,
          type: OrderType.LIMIT,
          size: 5,
          price: 1000,
        }),
        order({
          side: OrderSide.SELL,
          status: OrderStatus.REJECTED,
          size: 1000,
          price: 925.85,
        }),
        order({
          side: OrderSide.SELL,
          status: OrderStatus.CANCELLED,
          size: 10,
          price: 900,
        }),
        order({
          side: 'HOLD' as unknown as AvailabilityOrder['side'],
          status: OrderStatus.FILLED,
          size: 1,
          price: 10,
        }),
        order({
          side: OrderSide.SELL,
          status: OrderStatus.FILLED,
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
        side: OrderSide.CASH_IN,
        status: OrderStatus.FILLED,
        type: OrderType.MARKET,
      },
      {
        instrumentId: 47,
        size: 1,
        price: 10.33,
        side: OrderSide.BUY,
        status: OrderStatus.FILLED,
        type: OrderType.MARKET,
      },
      {
        instrumentId: 45,
        size: 1,
        price: 710.15,
        side: OrderSide.BUY,
        status: OrderStatus.NEW,
        type: OrderType.LIMIT,
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
