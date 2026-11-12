import { Controller, Get } from '@nestjs/common';
import { getCallContext } from '@/common/logging/call-context/call-context';
import { requireCallContextUserId } from '@/common/logging/call-context/require-call-context-user-id';
import { applyGetPortfolioSuccessCallContext } from '@/modules/portfolio/application/call-context/get-portfolio-call-context';
import { ApiGetPortfolio } from '@/modules/portfolio/application/dto/portfolio-openapi-examples';
import type { PortfolioResponse } from '@/modules/portfolio/application/dto/portfolio-response.types';
import { PortfolioService } from '@/modules/portfolio/application/services/portfolio.service';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @ApiGetPortfolio()
  @Get()
  async getPortfolio(): Promise<PortfolioResponse> {
    const userId = requireCallContextUserId(getCallContext());
    const portfolio = await this.portfolioService.getPortfolio(userId);
    applyGetPortfolioSuccessCallContext(getCallContext(), portfolio);
    return portfolio;
  }
}
