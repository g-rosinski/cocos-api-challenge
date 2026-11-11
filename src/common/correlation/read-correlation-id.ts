import { randomUUID } from 'node:crypto';

export function readCorrelationId(headerValue: string | undefined): string {
  const trimmed = headerValue?.trim();
  if (trimmed !== undefined && trimmed.length > 0) {
    return trimmed;
  }
  return randomUUID();
}
