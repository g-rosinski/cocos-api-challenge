import { Inject, Injectable } from '@nestjs/common';
import type { InstrumentsResponse } from './instruments-response.types.js';
import {
  INSTRUMENT_SEARCH,
  type InstrumentSearchPort,
} from './ports/instrument-search.port.js';
import type { SearchInstrumentsQuery } from './search-instruments-query.js';

@Injectable()
export class InstrumentsService {
  constructor(
    @Inject(INSTRUMENT_SEARCH)
    private readonly instrumentSearch: InstrumentSearchPort,
  ) {}

  search(input: SearchInstrumentsQuery): Promise<InstrumentsResponse> {
    return this.instrumentSearch.search({
      query: input.q.toLowerCase(),
      limit: input.limit,
      offset: input.offset,
    });
  }
}
