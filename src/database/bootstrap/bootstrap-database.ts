import { Logger } from '@nestjs/common';
import { bootstrapLocalDatabase } from '@/database/bootstrap/bootstrap-local-database';
import { createDatabaseOptions } from '@/database/typeorm/database-options';

const logger = new Logger('DatabaseBootstrap');

try {
  await bootstrapLocalDatabase(createDatabaseOptions(process.env));
  logger.log('Local database bootstrap completed');
} catch (error: unknown) {
  logger.error(
    'Local database bootstrap failed',
    error instanceof Error ? error.stack : String(error),
  );
  process.exitCode = 1;
}
