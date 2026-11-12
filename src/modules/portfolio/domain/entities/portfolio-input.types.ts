import type { OrderSide, OrderStatus } from '@/domain/order-types';

export type PortfolioOrderInput = {
  instrumentId: number;
  size: number;
  price: number;
  side: OrderSide;
  status: OrderStatus;
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
