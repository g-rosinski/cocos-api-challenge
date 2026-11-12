import type { InstrumentsResponse } from '@/instruments/instruments-response.types';
import { InstrumentsService } from '@/instruments/instruments.service';
import { INSTRUMENT_SEARCH } from '@/instruments/ports/instrument-search.port';
import type { InstrumentSearchPort } from '@/instruments/ports/instrument-search.port';

describe('InstrumentsService', () => {
  it('forwards an empty query with pagination defaults', async () => {
    const response: InstrumentsResponse = {
      data: [
        {
          instrument_id: 26,
          ticker: 'AGRO',
          name: 'Agrometal',
          type: 'ACCIONES',
        },
      ],
      meta: { total: 65, limit: 10, offset: 0 },
    };
    const instrumentSearch: InstrumentSearchPort = {
      search: vi.fn().mockResolvedValue(response),
    };
    const service = new InstrumentsService(instrumentSearch);

    await expect(
      service.search({ q: '', limit: 10, offset: 0 }),
    ).resolves.toEqual(response);
    expect(instrumentSearch.search).toHaveBeenCalledWith({
      query: '',
      limit: 10,
      offset: 0,
    });
    expect(INSTRUMENT_SEARCH).toBeDefined();
  });

  it('normalizes a partial ticker match to lowercase', async () => {
    const response: InstrumentsResponse = {
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
    const instrumentSearch: InstrumentSearchPort = {
      search: vi.fn().mockResolvedValue(response),
    };
    const service = new InstrumentsService(instrumentSearch);

    await expect(
      service.search({ q: 'Pamp', limit: 10, offset: 0 }),
    ).resolves.toEqual(response);
    expect(instrumentSearch.search).toHaveBeenCalledWith({
      query: 'pamp',
      limit: 10,
      offset: 0,
    });
  });

  it.each(['ARS', 'pesos'])(
    'returns an empty page when the port excludes MONEDA for %s',
    async (q) => {
      const empty: InstrumentsResponse = {
        data: [],
        meta: { total: 0, limit: 10, offset: 0 },
      };
      const instrumentSearch: InstrumentSearchPort = {
        search: vi.fn().mockResolvedValue(empty),
      };
      const service = new InstrumentsService(instrumentSearch);

      await expect(
        service.search({ q, limit: 10, offset: 0 }),
      ).resolves.toEqual(empty);
      expect(instrumentSearch.search).toHaveBeenCalledWith({
        query: q.toLowerCase(),
        limit: 10,
        offset: 0,
      });
    },
  );
});
