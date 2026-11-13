import { MissingEnvironmentVariableError } from '@/config/missing-environment-variable.error';
import { readDatabaseUrl } from '@/config/read-database-url';

describe('readDatabaseUrl', () => {
  it('returns the configured url', () => {
    expect(
      readDatabaseUrl({ DATABASE_URL: 'postgres://localhost/cocos' }),
    ).toBe('postgres://localhost/cocos');
  });

  it('rejects a missing url', () => {
    expect(() => readDatabaseUrl({})).toThrow(MissingEnvironmentVariableError);
  });
});
