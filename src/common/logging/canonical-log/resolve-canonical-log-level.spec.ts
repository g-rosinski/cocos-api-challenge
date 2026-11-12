import { resolveCanonicalLogLevel } from '@/common/logging/canonical-log/resolve-canonical-log-level';

describe('resolveCanonicalLogLevel', () => {
  it('returns info for successful and business client errors', () => {
    expect(resolveCanonicalLogLevel(200)).toBe('info');
    expect(resolveCanonicalLogLevel(400)).toBe('info');
    expect(resolveCanonicalLogLevel(404)).toBe('info');
  });

  it('returns warn for 401 and 429', () => {
    expect(resolveCanonicalLogLevel(401)).toBe('warn');
    expect(resolveCanonicalLogLevel(429)).toBe('warn');
  });

  it('returns error for server errors', () => {
    expect(resolveCanonicalLogLevel(500)).toBe('error');
    expect(resolveCanonicalLogLevel(503)).toBe('error');
  });
});
