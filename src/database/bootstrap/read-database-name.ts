import { InvalidDatabaseUrlError } from '@/database/bootstrap/invalid-database-url.error';

const DATABASE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function readDatabaseName(databaseUrl: string): string {
  const databaseName = decodeURIComponent(
    parseDatabaseUrl(databaseUrl).pathname.replace(/^\//, ''),
  );
  if (!DATABASE_NAME_PATTERN.test(databaseName)) {
    throw new InvalidDatabaseUrlError();
  }
  return databaseName;
}

export function maintenanceDatabaseUrl(databaseUrl: string): string {
  readDatabaseName(databaseUrl);
  const url = parseDatabaseUrl(databaseUrl);
  url.pathname = '/postgres';
  return url.toString();
}

function parseDatabaseUrl(databaseUrl: string): URL {
  try {
    return new URL(databaseUrl);
  } catch {
    throw new InvalidDatabaseUrlError();
  }
}
