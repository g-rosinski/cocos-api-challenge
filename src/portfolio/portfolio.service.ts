import { Inject, Injectable } from '@nestjs/common';
import { calculatePortfolio } from './domain/portfolio-calculator.js';
import {
  PORTFOLIO_READ,
  type PortfolioReadPort,
} from './ports/portfolio-read.port.js';
import type { PortfolioResponse } from './portfolio-response.types.js';

@Injectable()
export class PortfolioService {
  constructor(
    @Inject(PORTFOLIO_READ)
    private readonly portfolioRead: PortfolioReadPort,
  ) {}

  async getPortfolio(userId: number): Promise<PortfolioResponse> {
    const input = await this.portfolioRead.loadCalculationInput(userId);
    return calculatePortfolio(input);
  }
}
