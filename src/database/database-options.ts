import type { DataSourceOptions } from 'typeorm';
import { readDatabaseUrl } from '@/config/read-database-url';
import { AddSearchIndexesAndIdempotency1731340800000 } from '@/database/migrations/1731340800000-add-search-indexes-and-idempotency';

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
  };
}
