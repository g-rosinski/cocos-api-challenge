import { buildCanonicalLogMessage } from './build-canonical-log-message.js';

describe('buildCanonicalLogMessage', () => {
  it('includes business status when provided', () => {
    expect(
      buildCanonicalLogMessage({
        title: 'CreateOrder',
        status: 'FILLED',
        method: 'POST',
        path: '/orders',
        statusCode: 201,
        durationMs: 142,
      }),
    ).toBe('CreateOrder [FILLED] - POST /orders -> 201 142ms');
  });

  it('omits brackets when business status is missing', () => {
    expect(
      buildCanonicalLogMessage({
        title: 'SearchInstruments',
        method: 'GET',
        path: '/instruments',
        statusCode: 200,
        durationMs: 85,
      }),
    ).toBe('SearchInstruments - GET /instruments -> 200 85ms');
  });
});
