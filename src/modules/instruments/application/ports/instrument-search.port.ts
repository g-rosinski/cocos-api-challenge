import type { InstrumentsResponse } from '@/modules/instruments/application/dto/instruments-response.types';

export const INSTRUMENT_SEARCH = Symbol('INSTRUMENT_SEARCH');

export type InstrumentSearchInput = {
  query: string;
  limit: number;
  offset: number;
};

export type InstrumentSearchPort = {
  search(input: InstrumentSearchInput): Promise<InstrumentsResponse>;
};
