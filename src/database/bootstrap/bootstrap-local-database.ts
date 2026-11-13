import { Logger } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Client } from 'pg';
import { DataSource } from 'typeorm';
import type { DatabaseConfig } from '@/database/typeorm/database-options';
import { createDatabaseOptions } from '@/database/typeorm/database-options';
import {
  maintenanceDatabaseUrl,
  readDatabaseName,
} from '@/database/bootstrap/read-database-name';

const logger = new Logger('DatabaseBootstrap');

export async function bootstrapLocalDatabase(
  config: DatabaseConfig,
): Promise<void> {
  await ensureDatabaseExists(config.url);
  const dataSource = new DataSource(
    createDatabaseOptions({ DATABASE_URL: config.url }),
  );
  await dataSource.initialize();
  try {
    if (await challengeTablesExist(dataSource)) {
      logger.debug('Challenge tables already exist');
    } else {
      await loadChallengeSeed(config.url);
      logger.debug('Challenge seed loaded');
    }
    await dataSource.runMigrations();
  } finally {
    await dataSource.destroy();
  }
}

async function ensureDatabaseExists(databaseUrl: string): Promise<void> {
  const databaseName = readDatabaseName(databaseUrl);
  const client = new Client({
    connectionString: maintenanceDatabaseUrl(databaseUrl),
  });
  await client.connect();
  try {
    const existing = await client.query<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS "exists"',
      [databaseName],
    );
    if (existing.rows[0]?.exists === true) {
      return;
    }
    await client.query(`CREATE DATABASE "${databaseName}"`);
  } finally {
    await client.end();
  }
}

async function challengeTablesExist(dataSource: DataSource): Promise<boolean> {
  const rows: unknown = await dataSource.query(
    `SELECT to_regclass('public.users') AS users_table`,
  );
  if (!Array.isArray(rows) || rows.length === 0) {
    return false;
  }
  const row: unknown = rows[0];
  if (typeof row !== 'object' || row === null || !('users_table' in row)) {
    return false;
  }
  return row.users_table !== null && row.users_table !== undefined;
}

async function loadChallengeSeed(databaseUrl: string): Promise<void> {
  const seedSql = await readFile(
    join(import.meta.dirname, '../../database/seed.sql'),
    'utf8',
  );
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(seedSql);
  } finally {
    await client.end();
  }
}
