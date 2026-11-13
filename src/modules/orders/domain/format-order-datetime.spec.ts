import { formatOrderDatetime } from '@/modules/orders/domain/format-order-datetime';

describe('formatOrderDatetime', () => {
  it('formats a date without milliseconds or a timezone suffix', () => {
    expect(formatOrderDatetime(new Date('2026-11-10T13:06:00.000Z'))).toBe(
      '2026-11-10T13:06:00',
    );
  });

  it('normalizes a timestamp string from PostgreSQL', () => {
    expect(formatOrderDatetime('2026-11-10 13:06:00')).toBe(
      '2026-11-10T13:06:00',
    );
  });

  it('returns null for a value that is not a timestamp', () => {
    expect(formatOrderDatetime('ayer')).toBeNull();
    expect(formatOrderDatetime(new Date('invalid'))).toBeNull();
  });
});
