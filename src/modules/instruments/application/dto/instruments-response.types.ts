export type InstrumentItem = {
  instrument_id: number;
  ticker: string;
  name: string;
  type: string;
};

export type InstrumentsResponse = {
  data: InstrumentItem[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
};
