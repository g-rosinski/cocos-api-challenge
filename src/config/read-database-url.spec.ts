import { MissingEnvironmentVariableError } from './missing-environment-variable.error.js';
import { readDatabaseUrl } from './read-database-url.js';

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
