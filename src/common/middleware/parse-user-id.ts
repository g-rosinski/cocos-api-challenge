export function parseUserId(headerValue: string | undefined): number | null {
  if (headerValue === undefined) {
    return null;
  }
  const trimmed = headerValue.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}
