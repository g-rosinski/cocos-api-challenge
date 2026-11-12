import { Module } from '@nestjs/common';
import { TypeOrmPortfolioReadAdapter } from '@/portfolio/adapters/typeorm-portfolio-read.adapter';
import { PORTFOLIO_READ } from '@/portfolio/ports/portfolio-read.port';
import { PortfolioController } from '@/portfolio/portfolio.controller';
import { PortfolioService } from '@/portfolio/portfolio.service';

@Module({
  controllers: [PortfolioController],
  providers: [
    PortfolioService,
    TypeOrmPortfolioReadAdapter,
    {
      provide: PORTFOLIO_READ,
      useExisting: TypeOrmPortfolioReadAdapter,
    },
  ],
})
export class PortfolioModule {}
