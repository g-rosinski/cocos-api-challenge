import { Inject, Injectable } from '@nestjs/common';
import { calculatePortfolio } from '@/modules/portfolio/domain/portfolio-calculator';
import {
  PORTFOLIO_READ,
  type PortfolioReadPort,
} from '@/modules/portfolio/application/ports/portfolio-read.port';
import type { PortfolioResponse } from '@/modules/portfolio/application/dto/portfolio-response.types';

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
