import {
  MiddlewareConsumer,
  Module,
  NestModule,
  OnModuleInit,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { readDatabaseUrl } from './config/read-database-url.js';
import { CommonModule } from './common/common.module.js';
import { CorrelationMiddleware } from './common/correlation/correlation.middleware.js';
import { UserIdMiddleware } from './common/middleware/user-id.middleware.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { InstrumentsModule } from './instruments/instruments.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { PortfolioModule } from './portfolio/portfolio.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    CommonModule,
    HealthModule,
    InstrumentsModule,
    OrdersModule,
    PortfolioModule,
  ],
})
export class AppModule implements NestModule, OnModuleInit {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(CorrelationMiddleware)
      .exclude({ path: 'health', method: RequestMethod.GET })
      .forRoutes({ path: '*path', method: RequestMethod.ALL });

    consumer
      .apply(UserIdMiddleware)
      .forRoutes(
        { path: 'portfolio', method: RequestMethod.GET },
        { path: 'orders', method: RequestMethod.POST },
      );
  }

  onModuleInit(): void {
    readDatabaseUrl(process.env);
  }
}
