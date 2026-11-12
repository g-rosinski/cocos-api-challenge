import { toCents } from '@/ledger/cash-movement';
import type { OrderSide } from '@/modules/orders/domain/entities/order.types';

export type OrderAcceptanceInput = {
  side: OrderSide;
  size: number;
  price: number;
  availableCash: number;
  availableShares: number;
};

export function isOrderAccepted(input: OrderAcceptanceInput): boolean {
  if (!Number.isInteger(input.size) || input.size < 1) {
    return false;
  }
  if (input.side === 'BUY') {
    return toCents(input.availableCash) >= input.size * toCents(input.price);
  }
  return input.availableShares >= input.size;
}
