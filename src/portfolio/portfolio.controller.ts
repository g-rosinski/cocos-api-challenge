import { Controller, Get } from '@nestjs/common';
import { getCallContext } from '@/common/correlation/call-context';
import { InternalException } from '@/common/errors/internal.exception';
import { ApiGetPortfolio } from '@/portfolio/portfolio-openapi-examples';
import type { PortfolioResponse } from '@/portfolio/portfolio-response.types';
import { PortfolioService } from '@/portfolio/portfolio.service';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @ApiGetPortfolio()
  @Get()
  async getPortfolio(): Promise<PortfolioResponse> {
    const userId = getCallContext()?.userId;
    if (userId === undefined) {
      throw new InternalException();
    }
    const portfolio = await this.portfolioService.getPortfolio(userId);
    const callContext = getCallContext();
    if (callContext !== undefined) {
      callContext.title = 'GetPortfolio';
      callContext.attributes = {
        has_positions: portfolio.positions.length > 0,
        position_count: portfolio.positions.length,
      };
    }
    return portfolio;
  }
}
