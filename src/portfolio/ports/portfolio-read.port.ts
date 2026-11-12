import type { PortfolioCalculationInput } from '@/portfolio/domain/portfolio-input.types';

export const PORTFOLIO_READ = Symbol('PORTFOLIO_READ');

export type PortfolioReadPort = {
  loadCalculationInput(userId: number): Promise<PortfolioCalculationInput>;
};
