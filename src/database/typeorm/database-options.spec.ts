import { MissingEnvironmentVariableError } from '@/config/missing-environment-variable.error';
import { createDatabaseOptions } from '@/database/typeorm/database-options';

describe('createDatabaseOptions', () => {
  it('keeps synchronize disabled and uses the database url', () => {
    const options = createDatabaseOptions({
      DATABASE_URL: 'postgres://postgres:123456@localhost:5432/neondb',
    });

    expect(options.url).toBe(
      'postgres://postgres:123456@localhost:5432/neondb',
    );
    expect(options.synchronize).toBe(false);
    expect(options.migrationsRun).toBe(false);
    expect(options.migrations).toHaveLength(1);
  });

  it('rejects a missing url', () => {
    expect(() => createDatabaseOptions({})).toThrow(
      MissingEnvironmentVariableError,
    );
  });
});
