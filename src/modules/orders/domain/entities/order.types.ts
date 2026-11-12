export const ORDER_SIDES = ['BUY', 'SELL'] as const;

export type OrderSide = (typeof ORDER_SIDES)[number];

export const ORDER_TYPES = ['MARKET', 'LIMIT'] as const;

export type OrderType = (typeof ORDER_TYPES)[number];

export const ORDER_STATUSES = ['FILLED', 'NEW', 'REJECTED'] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type AcceptedOrderStatus = Extract<OrderStatus, 'FILLED' | 'NEW'>;
