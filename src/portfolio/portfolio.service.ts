import { Inject, Injectable } from '@nestjs/common';
import { calculatePortfolio } from '@/portfolio/domain/portfolio-calculator';
import {
  PORTFOLIO_READ,
  type PortfolioReadPort,
} from '@/portfolio/ports/portfolio-read.port';
import type { PortfolioResponse } from '@/portfolio/portfolio-response.types';

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
