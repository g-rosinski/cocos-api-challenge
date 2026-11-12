export const ORDER_SIDES = ['BUY', 'SELL'] as const;

export type OrderSide = (typeof ORDER_SIDES)[number];

export const ORDER_TYPES = ['MARKET', 'LIMIT'] as const;

export type OrderType = (typeof ORDER_TYPES)[number];

export type OrderStatus = 'FILLED' | 'NEW' | 'REJECTED';
