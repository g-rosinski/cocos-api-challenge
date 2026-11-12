import { Injectable } from '@nestjs/common';
import { CURRENCY_INSTRUMENT_TYPE } from '@/common/domain-constants';
import { DataSource } from 'typeorm';
import type {
  InstrumentItem,
  InstrumentsResponse,
} from '@/modules/instruments/application/dto/instruments-response.types';
import type {
  InstrumentSearchInput,
  InstrumentSearchPort,
} from '@/modules/instruments/application/ports/instrument-search.port';

type InstrumentSearchRow = {
  id: number;
  ticker: string;
  name: string;
  type: string;
};

type CountRow = {
  total: string | number;
};

const FILTER_SQL = `type <> '${CURRENCY_INSTRUMENT_TYPE}'
       AND ($1 = '' OR ticker ILIKE $2 ESCAPE E'\\\\' OR name ILIKE $2 ESCAPE E'\\\\')`;

function toNumber(value: string | number): number {
  return typeof value === 'number' ? value : Number(value);
}

function escapeLikePattern(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('%', '\\%')
    .replaceAll('_', '\\_');
}

function mapInstrumentRow(row: InstrumentSearchRow): InstrumentItem {
  return {
    instrument_id: row.id,
    ticker: row.ticker,
    name: row.name,
    type: row.type,
  };
}

@Injectable()
export class InstrumentSearchRepository implements InstrumentSearchPort {
  constructor(private readonly dataSource: DataSource) {}

  async search(input: InstrumentSearchInput): Promise<InstrumentsResponse> {
    const pattern =
      input.query === '' ? '' : `%${escapeLikePattern(input.query)}%`;
    const filterParams = [input.query, pattern];
    const [countRows, rows]: [CountRow[], InstrumentSearchRow[]] =
      await Promise.all([
        this.dataSource.query(
          `SELECT COUNT(*)::int AS total
       FROM instruments
       WHERE ${FILTER_SQL}`,
          filterParams,
        ),
        this.dataSource.query(
          `SELECT id, ticker, name, type
       FROM instruments
       WHERE ${FILTER_SQL}
       ORDER BY ticker ASC
       LIMIT $3 OFFSET $4`,
          [...filterParams, input.limit, input.offset],
        ),
      ]);
    const totalRow = countRows[0];
    return {
      data: rows.map(mapInstrumentRow),
      meta: {
        total: totalRow === undefined ? 0 : toNumber(totalRow.total),
        limit: input.limit,
        offset: input.offset,
      },
    };
  }
}
