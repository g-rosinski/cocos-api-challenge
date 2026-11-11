export type CanonicalLogLevel = 'info' | 'warn' | 'error';

export function resolveCanonicalLogLevel(
  statusCode: number,
): CanonicalLogLevel {
  if (statusCode >= 500) {
    return 'error';
  }
  if (statusCode === 401 || statusCode === 429) {
    return 'warn';
  }
  return 'info';
}
