import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { readDatabaseUrl } from './config/read-database-url.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    HealthModule,
  ],
})
export class AppModule implements OnModuleInit {
  onModuleInit(): void {
    readDatabaseUrl(process.env);
  }
}
