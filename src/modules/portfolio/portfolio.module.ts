import { Module } from '@nestjs/common';
import { TypeOrmPortfolioReadAdapter } from '@/modules/portfolio/infrastructure/repositories/typeorm-portfolio-read.adapter';
import { PORTFOLIO_READ } from '@/modules/portfolio/application/ports/portfolio-read.port';
import { PortfolioController } from '@/modules/portfolio/portfolio.controller';
import { PortfolioService } from '@/modules/portfolio/application/services/portfolio.service';

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
