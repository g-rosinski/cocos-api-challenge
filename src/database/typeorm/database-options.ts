import type { DataSourceOptions } from 'typeorm';
import { readDatabaseUrl } from '@/config/read-database-url';
import { AddSearchIndexesAndIdempotency1731340800000 } from '@/database/migrations/1731340800000-add-search-indexes-and-idempotency';
import { InstrumentEntity } from '@/modules/instruments/domain/entities/instrument.entity';
import { MarketDataEntity } from '@/modules/instruments/domain/entities/market-data.entity';
import { OrderEntity } from '@/modules/orders/domain/entities/order.entity';
import { OrderIdempotencyKeyEntity } from '@/modules/orders/domain/entities/order-idempotency-key.entity';
import { UserEntity } from '@/modules/users/domain/entities/user.entity';

export type DatabaseConfig = {
  url: string;
  synchronize: false;
};

export function createDatabaseOptions(
  env: NodeJS.ProcessEnv,
): DataSourceOptions & DatabaseConfig {
  return {
    type: 'postgres',
    url: readDatabaseUrl(env),
    synchronize: false,
    logging: false,
    migrationsRun: false,
    migrations: [AddSearchIndexesAndIdempotency1731340800000],
    entities: [
      UserEntity,
      OrderEntity,
      OrderIdempotencyKeyEntity,
      InstrumentEntity,
      MarketDataEntity,
    ],
  };
}
