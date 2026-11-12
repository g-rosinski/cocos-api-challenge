import type { PortfolioCalculationInput } from '@/modules/portfolio/domain/entities/portfolio-input.types';
import { PORTFOLIO_READ } from '@/modules/portfolio/application/ports/portfolio-read.port';
import type { PortfolioReadPort } from '@/modules/portfolio/application/ports/portfolio-read.port';
import { PortfolioService } from '@/modules/portfolio/application/services/portfolio.service';

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
