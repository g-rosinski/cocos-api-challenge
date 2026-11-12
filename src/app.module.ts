import {
  MiddlewareConsumer,
  Module,
  NestModule,
  OnModuleInit,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { readDatabaseUrl } from '@/config/read-database-url';
import { CommonModule } from '@/common/common.module';
import { CorrelationMiddleware } from '@/common/correlation/correlation.middleware';
import { UserIdMiddleware } from '@/common/middleware/user-id.middleware';
import { DatabaseModule } from '@/database/database.module';
import { HealthModule } from '@/modules/health/health.module';
import { InstrumentsModule } from '@/modules/instruments/instruments.module';
import { OrdersModule } from '@/modules/orders/orders.module';
import { PortfolioModule } from '@/modules/portfolio/portfolio.module';

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
