import type { OrderStatus } from '@/orders/domain/order.types';

export type PriceResolutionInput = {
  requestedPrice?: number;
  latestClose?: number;
};

export type OrderStrategy = {
  readonly acceptedStatus: Extract<OrderStatus, 'FILLED' | 'NEW'>;
  resolvePrice(input: PriceResolutionInput): number;
};
