import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, type TypeOrmModuleOptions } from '@nestjs/typeorm';
import { createDatabaseOptions } from '@/database/database-options';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
        ...createDatabaseOptions({
          DATABASE_URL: config.get<string>('DATABASE_URL'),
        }),
        retryAttempts: 0,
      }),
    }),
  ],
})
export class DatabaseModule {}
