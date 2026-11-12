import { Logger } from '@nestjs/common';
import { AppDataSource } from '@/database/data-source';

const logger = new Logger('MigrationRevert');

try {
  await AppDataSource.initialize();
  await AppDataSource.undoLastMigration();
  logger.log('Migration reverted');
} catch (error: unknown) {
  logger.error(
    'Migration revert failed',
    error instanceof Error ? error.stack : String(error),
  );
  process.exitCode = 1;
} finally {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}
