import { InvalidEnvironmentVariableError } from '@/config/invalid-environment-variable.error';

const DEFAULT_PORT = 3000;

export function readListenPort(env: NodeJS.ProcessEnv): number {
  const raw = env.PORT;
  if (raw === undefined || raw.trim() === '') {
    return DEFAULT_PORT;
  }
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new InvalidEnvironmentVariableError('PORT');
  }
  return port;
}
