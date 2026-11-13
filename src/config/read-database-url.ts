import { MissingEnvironmentVariableError } from '@/config/missing-environment-variable.error';

export function readDatabaseUrl(env: NodeJS.ProcessEnv): string {
  const databaseUrl = env.DATABASE_URL;
  if (typeof databaseUrl !== 'string' || databaseUrl.trim() === '') {
    throw new MissingEnvironmentVariableError('DATABASE_URL');
  }
  return databaseUrl;
}
