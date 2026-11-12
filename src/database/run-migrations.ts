import { Logger } from '@nestjs/common';
import { AppDataSource } from '@/database/data-source';

const logger = new Logger('MigrationRun');

try {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
  logger.log('Migrations applied');
} catch (error: unknown) {
  logger.error(
    'Migration run failed',
    error instanceof Error ? error.stack : String(error),
  );
  process.exitCode = 1;
} finally {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}
