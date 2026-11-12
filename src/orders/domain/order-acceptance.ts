import type { OrderSide } from './order.types.js';

export type OrderAcceptanceInput = {
  side: OrderSide;
  size: number;
  price: number;
  availableCash: number;
  availableShares: number;
};

function toCents(value: number): number {
  return Math.round(value * 100);
}

export function isOrderAccepted(input: OrderAcceptanceInput): boolean {
  if (!Number.isInteger(input.size) || input.size < 1) {
    return false;
  }
  if (input.side === 'BUY') {
    return toCents(input.availableCash) >= input.size * toCents(input.price);
  }
  return input.availableShares >= input.size;
}
