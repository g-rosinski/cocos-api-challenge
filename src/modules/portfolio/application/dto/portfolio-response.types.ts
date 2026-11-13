export type PositionResponse = {
  instrument_id: number;
  ticker: string;
  name: string;
  quantity: number;
  market_value: number;
  total_return_percentage: number;
};

export type PortfolioSummaryResponse = {
  total_value: number;
  cash_balance: number;
  currency: 'ARS';
};

export type PortfolioResponse = {
  summary: PortfolioSummaryResponse;
  positions: PositionResponse[];
};
