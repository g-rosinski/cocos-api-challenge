import { Controller, Get, Query } from '@nestjs/common';
import { getCallContext } from '@/common/correlation/call-context';
import { applySearchInstrumentsSuccessCallContext } from '@/modules/instruments/application/call-context/search-instruments-call-context';
import type { InstrumentsResponse } from '@/modules/instruments/application/dto/instruments-response.types';
import { ApiSearchInstruments } from '@/modules/instruments/application/dto/instruments-openapi-examples';
import { InstrumentsService } from '@/modules/instruments/application/services/instruments.service';
import {
  searchInstrumentsQuerySchema,
  searchInstrumentsValidationPipe,
  type SearchInstrumentsQuery,
} from '@/modules/instruments/application/dto/search-instruments-query';

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
    applySearchInstrumentsSuccessCallContext(getCallContext(), query, result);
    return result;
  }
}
