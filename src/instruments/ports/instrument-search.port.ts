import type { InstrumentsResponse } from '../instruments-response.types.js';

export const INSTRUMENT_SEARCH = Symbol('INSTRUMENT_SEARCH');

export type InstrumentSearchInput = {
  query: string;
  limit: number;
  offset: number;
};

export type InstrumentSearchPort = {
  search(input: InstrumentSearchInput): Promise<InstrumentsResponse>;
};
