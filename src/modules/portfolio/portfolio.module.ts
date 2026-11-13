import { Module } from '@nestjs/common';
import { PortfolioReadRepository } from '@/modules/portfolio/infrastructure/repositories/portfolio-read.repository';
import { PORTFOLIO_READ } from '@/modules/portfolio/application/ports/portfolio-read.port';
import { PortfolioController } from '@/modules/portfolio/portfolio.controller';
import { PortfolioService } from '@/modules/portfolio/application/services/portfolio.service';

@Module({
  controllers: [PortfolioController],
  providers: [
    PortfolioService,
    PortfolioReadRepository,
    {
      provide: PORTFOLIO_READ,
      useExisting: PortfolioReadRepository,
    },
  ],
})
export class PortfolioModule {}
