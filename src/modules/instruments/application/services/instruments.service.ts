import { Inject, Injectable } from '@nestjs/common';
import type { InstrumentsResponse } from '@/modules/instruments/application/dto/instruments-response.types';
import {
  INSTRUMENT_SEARCH,
  type InstrumentSearchPort,
} from '@/modules/instruments/application/ports/instrument-search.port';
import type { SearchInstrumentsQuery } from '@/modules/instruments/application/dto/search-instruments-query';

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
