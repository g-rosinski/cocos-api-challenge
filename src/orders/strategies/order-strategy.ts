import type { OrderStatus } from '../domain/order.types.js';

export type PriceResolutionInput = {
  requestedPrice?: number;
  latestClose?: number;
};

export type OrderStrategy = {
  readonly acceptedStatus: Extract<OrderStatus, 'FILLED' | 'NEW'>;
  resolvePrice(input: PriceResolutionInput): number;
};
