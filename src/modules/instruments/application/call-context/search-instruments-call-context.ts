import type { CallContext } from '@/common/logging/call-context/call-context';
import type { InstrumentsResponse } from '@/modules/instruments/application/dto/instruments-response.types';
import type { SearchInstrumentsQuery } from '@/modules/instruments/application/dto/search-instruments-query';

export function applySearchInstrumentsSuccessCallContext(
  context: CallContext | undefined,
  query: SearchInstrumentsQuery,
  result: InstrumentsResponse,
): void {
  if (context === undefined) {
    return;
  }
  context.title = 'SearchInstruments';
  context.attributes = {
    query: query.q,
    limit: query.limit,
    offset: query.offset,
    result_count: result.data.length,
  };
}
