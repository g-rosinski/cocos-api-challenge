import { InvalidDatabaseUrlError } from './invalid-database-url.error.js';
import {
  maintenanceDatabaseUrl,
  readDatabaseName,
} from './read-database-name.js';

describe('readDatabaseName', () => {
  it('reads the database name from the url', () => {
    expect(
      readDatabaseName('postgres://postgres:123456@localhost:5432/neondb'),
    ).toBe('neondb');
  });

  it('rejects a database name that is not a plain identifier', () => {
    expect(() =>
      readDatabaseName('postgres://postgres:123456@localhost:5432/neon%3Bdb'),
    ).toThrow(InvalidDatabaseUrlError);
  });

  it('rejects a malformed database url', () => {
    expect(() => readDatabaseName('not-a-url')).toThrow(
      InvalidDatabaseUrlError,
    );
  });

  it('points maintenance connections at the postgres database', () => {
    expect(
      maintenanceDatabaseUrl(
        'postgres://postgres:123456@localhost:5432/neondb',
      ),
    ).toBe('postgres://postgres:123456@localhost:5432/postgres');
  });
});
