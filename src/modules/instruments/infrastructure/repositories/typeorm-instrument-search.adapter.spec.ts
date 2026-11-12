import { DataSource } from 'typeorm';
import { TypeOrmInstrumentSearchAdapter } from '@/modules/instruments/infrastructure/repositories/typeorm-instrument-search.adapter';

describe('TypeOrmInstrumentSearchAdapter', () => {
  it('maps matching rows and excludes MONEDA in SQL', async () => {
    const query = vi.fn().mockImplementation(async (sql: string) => {
      if (sql.includes('COUNT(*)')) {
        return [{ total: '1' }];
      }
      return [
        {
          id: 47,
          ticker: 'PAMP',
          name: 'Pampa Holding S.A.',
          type: 'ACCIONES',
        },
      ];
    });
    const adapter = new TypeOrmInstrumentSearchAdapter({
      query,
    } as unknown as DataSource);

    const response = await adapter.search({
      query: 'pamp',
      limit: 10,
      offset: 0,
    });

    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[0]?.[0]).toContain("type <> 'MONEDA'");
    expect(query.mock.calls[0]?.[0]).toContain('ILIKE');
    expect(query.mock.calls[1]?.[0]).toContain('ORDER BY ticker ASC');
    expect(query.mock.calls[1]?.[1]).toEqual(['pamp', '%pamp%', 10, 0]);
    expect(response).toEqual({
      data: [
        {
          instrument_id: 47,
          ticker: 'PAMP',
          name: 'Pampa Holding S.A.',
          type: 'ACCIONES',
        },
      ],
      meta: { total: 1, limit: 10, offset: 0 },
    });
  });

  it('skips the like pattern when the query is empty', async () => {
    const query = vi.fn().mockImplementation(async (sql: string) => {
      if (sql.includes('COUNT(*)')) {
        return [{ total: 65 }];
      }
      return [{ id: 26, ticker: 'AGRO', name: 'Agrometal', type: 'ACCIONES' }];
    });
    const adapter = new TypeOrmInstrumentSearchAdapter({
      query,
    } as unknown as DataSource);

    const response = await adapter.search({
      query: '',
      limit: 10,
      offset: 0,
    });

    expect(query.mock.calls[0]?.[1]).toEqual(['', '']);
    expect(query.mock.calls[1]?.[1]).toEqual(['', '', 10, 0]);
    expect(response.meta.total).toBe(65);
    expect(response.data[0]?.ticker).toBe('AGRO');
  });

  it('escapes like metacharacters and keeps total when the page is empty', async () => {
    const query = vi.fn().mockImplementation(async (sql: string) => {
      if (sql.includes('COUNT(*)')) {
        return [{ total: 65 }];
      }
      return [];
    });
    const adapter = new TypeOrmInstrumentSearchAdapter({
      query,
    } as unknown as DataSource);

    const response = await adapter.search({
      query: 'a%_\\b',
      limit: 10,
      offset: 100,
    });

    expect(query.mock.calls[1]?.[1]).toEqual([
      'a%_\\b',
      '%a\\%\\_\\\\b%',
      10,
      100,
    ]);
    expect(response).toEqual({
      data: [],
      meta: { total: 65, limit: 10, offset: 100 },
    });
  });

  it('returns total 0 when count has no row', async () => {
    const query = vi.fn().mockImplementation(async (sql: string) => {
      if (sql.includes('COUNT(*)')) {
        return [];
      }
      return [];
    });
    const adapter = new TypeOrmInstrumentSearchAdapter({
      query,
    } as unknown as DataSource);

    const response = await adapter.search({
      query: 'missing',
      limit: 5,
      offset: 0,
    });

    expect(response.meta.total).toBe(0);
  });
});
