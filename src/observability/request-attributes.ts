import type { CallContext } from '../common/correlation/call-context.js';
import type { CanonicalLogAttributes } from '../common/logging/canonical-log-attribute.js';
import {
  ORDER_SIDES,
  ORDER_TYPES,
  type OrderSide,
  type OrderStatus,
  type OrderType,
} from '../orders/domain/order.types.js';

const ORDER_STATUSES: readonly OrderStatus[] = ['FILLED', 'NEW', 'REJECTED'];

export const FORBIDDEN_SPAN_ATTRIBUTE_KEYS = new Set([
  'email',
  'accountNumber',
]);

export type RequestAttributes = {
  correlationId: string;
  route: string;
  httpStatus: number;
  userId?: number;
};

export type OrderAttributes = RequestAttributes & {
  orderSide: OrderSide;
  orderType: OrderType;
  orderStatus: OrderStatus;
};

export function isOrderAttributes(
  attributes: RequestAttributes | OrderAttributes,
): attributes is OrderAttributes {
  return (
    'orderSide' in attributes &&
    'orderType' in attributes &&
    'orderStatus' in attributes
  );
}

export function buildRequestSpanAttributes(input: {
  callContext: CallContext | undefined;
  route: string;
  httpStatus: number;
}): RequestAttributes | undefined {
  if (input.callContext === undefined) {
    return undefined;
  }
  const attributes: RequestAttributes = {
    correlationId: input.callContext.correlationId,
    route: input.route,
    httpStatus: input.httpStatus,
  };
  if (input.callContext.userId !== undefined) {
    attributes.userId = input.callContext.userId;
  }
  const orderFields = resolveOrderSpanFields(input.callContext);
  if (orderFields === undefined) {
    return attributes;
  }
  return {
    ...attributes,
    ...orderFields,
  };
}

function resolveOrderSpanFields(
  callContext: CallContext,
):
  Pick<OrderAttributes, 'orderSide' | 'orderType' | 'orderStatus'> | undefined {
  const status = readOrderStatus(callContext.status);
  if (status === undefined) {
    return undefined;
  }
  const bag: CanonicalLogAttributes = {
    ...(callContext.attributes ?? {}),
  };
  const orderSide = readOrderSide(bag.side);
  const orderType = readOrderType(bag.type);
  if (orderSide === undefined || orderType === undefined) {
    return undefined;
  }
  return { orderSide, orderType, orderStatus: status };
}

function readOrderStatus(value: string | undefined): OrderStatus | undefined {
  if (value === undefined) {
    return undefined;
  }
  return ORDER_STATUSES.includes(value as OrderStatus)
    ? (value as OrderStatus)
    : undefined;
}

function readOrderSide(value: unknown): OrderSide | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  return (ORDER_SIDES as readonly string[]).includes(value)
    ? (value as OrderSide)
    : undefined;
}

function readOrderType(value: unknown): OrderType | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  return (ORDER_TYPES as readonly string[]).includes(value)
    ? (value as OrderType)
    : undefined;
}

export function forbiddenKeysInAttributes(
  attributes: RequestAttributes | OrderAttributes,
): string[] {
  return Object.keys(attributes).filter((key) =>
    FORBIDDEN_SPAN_ATTRIBUTE_KEYS.has(key),
  );
}
