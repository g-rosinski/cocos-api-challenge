import type { PortfolioCalculationInput } from '../domain/portfolio-input.types.js';

export const PORTFOLIO_READ = Symbol('PORTFOLIO_READ');

export type PortfolioReadPort = {
  loadCalculationInput(userId: number): Promise<PortfolioCalculationInput>;
};
