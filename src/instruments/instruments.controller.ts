import { Controller, Get, Query } from '@nestjs/common';
import { getCallContext } from '@/common/correlation/call-context';
import type { InstrumentsResponse } from '@/instruments/instruments-response.types';
import { ApiSearchInstruments } from '@/instruments/instruments-openapi-examples';
import { InstrumentsService } from '@/instruments/instruments.service';
import {
  searchInstrumentsQuerySchema,
  searchInstrumentsValidationPipe,
  type SearchInstrumentsQuery,
} from '@/instruments/search-instruments-query';

@Controller('instruments')
export class InstrumentsController {
  constructor(private readonly instrumentsService: InstrumentsService) {}

  @ApiSearchInstruments()
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
