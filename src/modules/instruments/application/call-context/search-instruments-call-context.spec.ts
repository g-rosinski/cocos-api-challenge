import type { InstrumentsResponse } from '@/modules/instruments/application/dto/instruments-response.types';
import { applySearchInstrumentsSuccessCallContext } from '@/modules/instruments/application/call-context/search-instruments-call-context';

describe('search-instruments call context', () => {
  const query = { q: 'pamp', limit: 10, offset: 0 };

  const sampleResponse: InstrumentsResponse = {
    data: [
      {
        instrument_id: 47,
        ticker: 'PAMP',
        name: 'Pampa Holding S.A.',
        type: 'ACCIONES',
      },
    ],
    meta: { total: 1, limit: 10, offset: 0 },
  };

  it('does nothing when context is undefined', () => {
    expect(() =>
      applySearchInstrumentsSuccessCallContext(
        undefined,
        query,
        sampleResponse,
      ),
    ).not.toThrow();
  });

  it('sets title and search attributes', () => {
    const context = { correlationId: 'corr-1' };
    applySearchInstrumentsSuccessCallContext(context, query, sampleResponse);
    expect(context.title).toBe('SearchInstruments');
    expect(context.attributes).toEqual({
      query: 'pamp',
      limit: 10,
      offset: 0,
      result_count: 1,
    });
  });

  it('sets result_count to zero for an empty page', () => {
    const empty: InstrumentsResponse = {
      data: [],
      meta: { total: 0, limit: 10, offset: 0 },
    };
    const context = { correlationId: 'corr-2' };
    applySearchInstrumentsSuccessCallContext(context, query, empty);
    expect(context.attributes?.result_count).toBe(0);
  });
});
