import type { PortfolioResponse } from '@/modules/portfolio/application/dto/portfolio-response.types';
import { applyGetPortfolioSuccessCallContext } from '@/modules/portfolio/application/call-context/get-portfolio-call-context';

describe('get-portfolio call context', () => {
  const portfolioWithPositions: PortfolioResponse = {
    summary: {
      total_value: 100,
      cash_balance: 100,
      currency: 'ARS',
    },
    positions: [
      {
        instrument_id: 47,
        ticker: 'PAMP',
        name: 'Pampa Holding S.A.',
        quantity: 1,
        market_value: 50,
        total_return_percentage: 0,
      },
    ],
  };

  it('does nothing when context is undefined', () => {
    expect(() =>
      applyGetPortfolioSuccessCallContext(undefined, portfolioWithPositions),
    ).not.toThrow();
  });

  it('sets title and attributes when positions exist', () => {
    const context = { correlationId: 'corr-1', userId: 1 };
    applyGetPortfolioSuccessCallContext(context, portfolioWithPositions);
    expect(context.title).toBe('GetPortfolio');
    expect(context.attributes).toEqual({
      has_positions: true,
      position_count: 1,
    });
  });

  it('marks has_positions false when empty', () => {
    const empty: PortfolioResponse = {
      summary: { total_value: 0, cash_balance: 0, currency: 'ARS' },
      positions: [],
    };
    const context = { correlationId: 'corr-2', userId: 1 };
    applyGetPortfolioSuccessCallContext(context, empty);
    expect(context.attributes).toEqual({
      has_positions: false,
      position_count: 0,
    });
  });
});
