import { Module } from '@nestjs/common';
import { TypeOrmPortfolioReadAdapter } from './adapters/typeorm-portfolio-read.adapter.js';
import { PORTFOLIO_READ } from './ports/portfolio-read.port.js';
import { PortfolioController } from './portfolio.controller.js';
import { PortfolioService } from './portfolio.service.js';

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
