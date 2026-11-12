export function formatOrderDatetime(value: Date | string): string | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    return value.toISOString().slice(0, 19);
  }
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})/.exec(value);
  if (match?.[1] === undefined || match[2] === undefined) {
    return null;
  }
  return `${match[1]}T${match[2]}`;
}
