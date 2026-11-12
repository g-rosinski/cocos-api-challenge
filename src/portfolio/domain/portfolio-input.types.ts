export type PortfolioOrderInput = {
  instrumentId: number;
  size: number;
  price: number;
  side: string;
  status: string;
  type: string;
};

export type PortfolioInstrumentInput = {
  id: number;
  ticker: string;
  name: string;
  type: string;
};

export type PortfolioCalculationInput = {
  orders: PortfolioOrderInput[];
  instruments: PortfolioInstrumentInput[];
  latestCloses: Map<number, number>;
};
