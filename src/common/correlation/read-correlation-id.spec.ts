import { readCorrelationId } from '@/common/correlation/read-correlation-id';

describe('readCorrelationId', () => {
  it('reuses the incoming header value', () => {
    expect(readCorrelationId('8f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21')).toBe(
      '8f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21',
    );
  });

  it('generates a uuid when the header is missing', () => {
    const correlationId = readCorrelationId(undefined);
    expect(correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});
