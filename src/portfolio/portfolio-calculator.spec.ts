import { calculatePortfolio } from '@/portfolio/domain/portfolio-calculator';
import type {
  PortfolioCalculationInput,
  PortfolioInstrumentInput,
  PortfolioOrderInput,
} from '@/portfolio/domain/portfolio-input.types';

const ars: PortfolioInstrumentInput = {
  id: 66,
  ticker: 'ARS',
  name: 'PESOS',
  type: 'MONEDA',
};

const pamp: PortfolioInstrumentInput = {
  id: 47,
  ticker: 'PAMP',
  name: 'Pampa Holding S.A.',
  type: 'ACCIONES',
};

const metr: PortfolioInstrumentInput = {
  id: 54,
  ticker: 'METR',
  name: 'MetroGAS S.A.',
  type: 'ACCIONES',
};

const macro: PortfolioInstrumentInput = {
  id: 31,
  ticker: 'BMA',
  name: 'Banco Macro S.A.',
  type: 'ACCIONES',
};

const loma: PortfolioInstrumentInput = {
  id: 45,
  ticker: 'LOMA',
  name: 'Loma Negra',
  type: 'ACCIONES',
};

function buildInput(
  orders: PortfolioOrderInput[],
  instruments: PortfolioInstrumentInput[],
  latestCloses: Record<number, number>,
): PortfolioCalculationInput {
  return {
    orders,
    instruments,
    latestCloses: new Map(
      Object.entries(latestCloses).map(([id, close]) => [Number(id), close]),
    ),
  };
}

describe('calculatePortfolio', () => {
  it('matches Emiliano account from the seed', () => {
    const orders: PortfolioOrderInput[] = [
      {
        instrumentId: 66,
        size: 1_000_000,
        price: 1,
        side: 'CASH_IN',
        status: 'FILLED',
        type: 'MARKET',
      },
      {
        instrumentId: 47,
        size: 50,
        price: 930,
        side: 'BUY',
        status: 'FILLED',
        type: 'MARKET',
      },
      {
        instrumentId: 47,
        size: 50,
        price: 920,
        side: 'BUY',
        status: 'CANCELLED',
        type: 'LIMIT',
      },
      {
        instrumentId: 47,
        size: 10,
        price: 940,
        side: 'SELL',
        status: 'FILLED',
        type: 'MARKET',
      },
      {
        instrumentId: 45,
        size: 50,
        price: 710,
        side: 'BUY',
        status: 'NEW',
        type: 'LIMIT',
      },
      {
        instrumentId: 47,
        size: 100,
        price: 950,
        side: 'SELL',
        status: 'REJECTED',
        type: 'MARKET',
      },
      {
        instrumentId: 31,
        size: 60,
        price: 1500,
        side: 'BUY',
        status: 'NEW',
        type: 'LIMIT',
      },
      {
        instrumentId: 66,
        size: 100_000,
        price: 1,
        side: 'CASH_OUT',
        status: 'FILLED',
        type: 'MARKET',
      },
      {
        instrumentId: 31,
        size: 20,
        price: 1540,
        side: 'BUY',
        status: 'FILLED',
        type: 'LIMIT',
      },
      {
        instrumentId: 54,
        size: 500,
        price: 250,
        side: 'BUY',
        status: 'FILLED',
        type: 'MARKET',
      },
      {
        instrumentId: 31,
        size: 30,
        price: 1530,
        side: 'SELL',
        status: 'FILLED',
        type: 'MARKET',
      },
    ];
    const result = calculatePortfolio(
      buildInput(orders, [ars, pamp, metr, macro, loma], {
        47: 925.85,
        54: 229.5,
        31: 1502.8,
      }),
    );

    expect(result.summary).toEqual({
      total_value: 904_784,
      cash_balance: 627_500,
      currency: 'ARS',
    });
    expect(result.positions).toHaveLength(2);
    expect(result.positions[0]).toEqual({
      instrument_id: 54,
      ticker: 'METR',
      name: 'MetroGAS S.A.',
      quantity: 500,
      market_value: 114_750,
      total_return_percentage: -8.2,
    });
    expect(result.positions[1]).toEqual({
      instrument_id: 47,
      ticker: 'PAMP',
      name: 'Pampa Holding S.A.',
      quantity: 40,
      market_value: 37_034,
      total_return_percentage: -0.45,
    });
  });

  it('ignores REJECTED and CANCELLED and applies NEW buy cash reserve', () => {
    const orders: PortfolioOrderInput[] = [
      {
        instrumentId: 66,
        size: 10_000,
        price: 1,
        side: 'CASH_IN',
        status: 'FILLED',
        type: 'MARKET',
      },
      {
        instrumentId: 47,
        size: 5,
        price: 100,
        side: 'BUY',
        status: 'FILLED',
        type: 'MARKET',
      },
      {
        instrumentId: 47,
        size: 2,
        price: 110,
        side: 'BUY',
        status: 'CANCELLED',
        type: 'LIMIT',
      },
      {
        instrumentId: 47,
        size: 20,
        price: 120,
        side: 'SELL',
        status: 'REJECTED',
        type: 'MARKET',
      },
      {
        instrumentId: 47,
        size: 1,
        price: 90,
        side: 'BUY',
        status: 'NEW',
        type: 'LIMIT',
      },
    ];
    const result = calculatePortfolio(
      buildInput(orders, [ars, pamp], { 47: 100 }),
    );

    expect(result.summary.cash_balance).toBe(9_410);
    expect(result.summary.total_value).toBe(10_000);
    expect(result.positions).toHaveLength(1);
    expect(result.positions[0]?.quantity).toBe(5);
  });

  it('ignores filled orders with an unknown side when adjusting cash', () => {
    const orders: PortfolioOrderInput[] = [
      {
        instrumentId: 66,
        size: 1_000,
        price: 1,
        side: 'CASH_IN',
        status: 'FILLED',
        type: 'MARKET',
      },
      {
        instrumentId: 66,
        size: 100,
        price: 1,
        side: 'UNKNOWN',
        status: 'FILLED',
        type: 'MARKET',
      },
    ];
    const result = calculatePortfolio(buildInput(orders, [ars], {}));

    expect(result.summary.total_value).toBe(1_000);
    expect(result.summary.cash_balance).toBe(1_000);
  });

  it('skips positions when the latest close is missing', () => {
    const orders: PortfolioOrderInput[] = [
      {
        instrumentId: 66,
        size: 10_000,
        price: 1,
        side: 'CASH_IN',
        status: 'FILLED',
        type: 'MARKET',
      },
      {
        instrumentId: 47,
        size: 2,
        price: 100,
        side: 'BUY',
        status: 'FILLED',
        type: 'MARKET',
      },
    ];
    const result = calculatePortfolio(buildInput(orders, [ars, pamp], {}));

    expect(result.positions).toHaveLength(0);
    expect(result.summary.total_value).toBe(9_800);
  });

  it('keeps average cost on a partial sell and clears it when quantity reaches zero', () => {
    const orders: PortfolioOrderInput[] = [
      {
        instrumentId: 66,
        size: 20_000,
        price: 1,
        side: 'CASH_IN',
        status: 'FILLED',
        type: 'MARKET',
      },
      {
        instrumentId: 47,
        size: 10,
        price: 100,
        side: 'BUY',
        status: 'FILLED',
        type: 'MARKET',
      },
      {
        instrumentId: 47,
        size: 3,
        price: 120,
        side: 'SELL',
        status: 'FILLED',
        type: 'MARKET',
      },
      {
        instrumentId: 47,
        size: 7,
        price: 130,
        side: 'SELL',
        status: 'FILLED',
        type: 'MARKET',
      },
    ];
    const result = calculatePortfolio(
      buildInput(orders, [ars, pamp], { 47: 100 }),
    );

    expect(result.positions).toHaveLength(0);
    expect(result.summary.total_value).toBe(20_270);
  });

  it('ignores filled size-zero buys and zero-cost positions when computing return', () => {
    const orders: PortfolioOrderInput[] = [
      {
        instrumentId: 66,
        size: 5_000,
        price: 1,
        side: 'CASH_IN',
        status: 'FILLED',
        type: 'MARKET',
      },
      {
        instrumentId: 47,
        size: 0,
        price: 100,
        side: 'BUY',
        status: 'FILLED',
        type: 'MARKET',
      },
      {
        instrumentId: 47,
        size: 2,
        price: 0,
        side: 'BUY',
        status: 'FILLED',
        type: 'MARKET',
      },
    ];
    const result = calculatePortfolio(
      buildInput(orders, [ars, pamp], { 47: 50 }),
    );

    expect(result.positions).toEqual([
      {
        instrument_id: 47,
        ticker: 'PAMP',
        name: 'Pampa Holding S.A.',
        quantity: 2,
        market_value: 100,
        total_return_percentage: 0,
      },
    ]);
  });

  it('does not mutate holdings on filled orders whose side is neither buy nor sell', () => {
    const orders: PortfolioOrderInput[] = [
      {
        instrumentId: 66,
        size: 5_000,
        price: 1,
        side: 'CASH_IN',
        status: 'FILLED',
        type: 'MARKET',
      },
      {
        instrumentId: 47,
        size: 3,
        price: 100,
        side: 'BUY',
        status: 'FILLED',
        type: 'MARKET',
      },
      {
        instrumentId: 47,
        size: 1,
        price: 200,
        side: 'UNKNOWN',
        status: 'FILLED',
        type: 'MARKET',
      },
    ];
    const result = calculatePortfolio(
      buildInput(orders, [ars, pamp], { 47: 100 }),
    );

    expect(result.positions[0]?.quantity).toBe(3);
  });

  it('does not update holdings for cash movements or non-tradable instruments', () => {
    const orders: PortfolioOrderInput[] = [
      {
        instrumentId: 66,
        size: 1_000,
        price: 1,
        side: 'CASH_IN',
        status: 'FILLED',
        type: 'MARKET',
      },
      {
        instrumentId: 66,
        size: 1,
        price: 1,
        side: 'BUY',
        status: 'FILLED',
        type: 'MARKET',
      },
      {
        instrumentId: 99,
        size: 5,
        price: 10,
        side: 'BUY',
        status: 'FILLED',
        type: 'MARKET',
      },
    ];
    const result = calculatePortfolio(buildInput(orders, [ars], {}));

    expect(result.positions).toHaveLength(0);
    expect(result.summary.total_value).toBe(949);
  });

  it('does not list zero or negative holdings', () => {
    const orders: PortfolioOrderInput[] = [
      {
        instrumentId: 66,
        size: 100_000,
        price: 1,
        side: 'CASH_IN',
        status: 'FILLED',
        type: 'MARKET',
      },
      {
        instrumentId: 31,
        size: 20,
        price: 100,
        side: 'BUY',
        status: 'FILLED',
        type: 'MARKET',
      },
      {
        instrumentId: 31,
        size: 30,
        price: 110,
        side: 'SELL',
        status: 'FILLED',
        type: 'MARKET',
      },
    ];
    const result = calculatePortfolio(
      buildInput(orders, [ars, macro], { 31: 100 }),
    );

    expect(result.positions).toHaveLength(0);
    expect(result.summary.total_value).toBe(101_300);
  });
});
