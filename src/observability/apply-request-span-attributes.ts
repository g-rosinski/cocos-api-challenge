import type { Span } from '@opentelemetry/api';
import {
  type OrderAttributes,
  type RequestAttributes,
  isOrderAttributes,
} from './request-attributes.js';

export function applyRequestSpanAttributes(
  span: Span,
  attributes: RequestAttributes | OrderAttributes,
): void {
  span.setAttribute('correlationId', attributes.correlationId);
  span.setAttribute('route', attributes.route);
  span.setAttribute('httpStatus', attributes.httpStatus);
  if (attributes.userId !== undefined) {
    span.setAttribute('userId', attributes.userId);
  }
  if (!isOrderAttributes(attributes)) {
    return;
  }
  applyOrderSpanAttributes(span, attributes);
}

function applyOrderSpanAttributes(
  span: Span,
  attributes: OrderAttributes,
): void {
  span.setAttribute('orderSide', attributes.orderSide);
  span.setAttribute('orderType', attributes.orderType);
  span.setAttribute('orderStatus', attributes.orderStatus);
}
