import type { PortfolioCalculationInput } from './domain/portfolio-input.types.js';
import { PORTFOLIO_READ } from './ports/portfolio-read.port.js';
import type { PortfolioReadPort } from './ports/portfolio-read.port.js';
import { PortfolioService } from './portfolio.service.js';

describe('PortfolioService', () => {
  it('loads calculation input and delegates to the portfolio calculator', async () => {
    const input: PortfolioCalculationInput = {
      orders: [],
      instruments: [],
      latestCloses: new Map(),
    };
    const portfolioRead: PortfolioReadPort = {
      loadCalculationInput: vi.fn().mockResolvedValue(input),
    };
    const service = new PortfolioService(portfolioRead);

    const response = await service.getPortfolio(1);

    expect(portfolioRead.loadCalculationInput).toHaveBeenCalledWith(1);
    expect(response).toEqual({
      summary: {
        total_value: 0,
        cash_balance: 0,
        currency: 'ARS',
      },
      positions: [],
    });
    expect(PORTFOLIO_READ).toBeDefined();
  });
});
