import { Controller, Get, Query } from '@nestjs/common';
import { getCallContext } from '../common/correlation/call-context.js';
import type { InstrumentsResponse } from './instruments-response.types.js';
import { InstrumentsService } from './instruments.service.js';
import {
  searchInstrumentsQuerySchema,
  searchInstrumentsValidationPipe,
  type SearchInstrumentsQuery,
} from './search-instruments-query.js';

@Controller('instruments')
export class InstrumentsController {
  constructor(private readonly instrumentsService: InstrumentsService) {}

  @Get()
  async searchInstruments(
    @Query({
      schema: searchInstrumentsQuerySchema,
      pipes: [searchInstrumentsValidationPipe],
    })
    query: SearchInstrumentsQuery,
  ): Promise<InstrumentsResponse> {
    const result = await this.instrumentsService.search(query);
    const callContext = getCallContext();
    if (callContext !== undefined) {
      callContext.title = 'SearchInstruments';
      callContext.attributes = {
        query: query.q,
        limit: query.limit,
        offset: query.offset,
        result_count: result.data.length,
      };
    }
    return result;
  }
}
