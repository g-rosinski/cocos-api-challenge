import type { OrderState } from '@/modules/orders/domain/states/order-state';

export type PriceResolutionInput = {
  requestedPrice?: number;
  latestClose?: number;
};

export type OrderStrategy = {
  readonly state: OrderState;
  resolvePrice(input: PriceResolutionInput): number;
};
