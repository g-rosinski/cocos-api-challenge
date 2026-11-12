import type { CallContext } from '@/common/logging/call-context/call-context';
import type { CanonicalLogAttributes } from '@/common/logging/canonical-log/canonical-log-attribute';
import {
  buildCanonicalLogMessage,
  buildDefaultCanonicalTitle,
} from '@/common/logging/canonical-log/build-canonical-log-message';

export type CanonicalLogPayload = {
  message: string;
  correlationId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userId?: number;
  context: CanonicalLogAttributes;
};

export function buildCanonicalLogPayload(input: {
  callContext: CallContext;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
}): CanonicalLogPayload {
  const title =
    input.callContext.title ??
    buildDefaultCanonicalTitle(input.method, input.path);
  const message = buildCanonicalLogMessage({
    title,
    status: input.callContext.status,
    method: input.method,
    path: input.path,
    statusCode: input.statusCode,
    durationMs: input.durationMs,
  });
  const context: CanonicalLogAttributes = {
    ...(input.callContext.attributes ?? {}),
  };
  if (input.callContext.status !== undefined) {
    context.transaction_status = input.callContext.status;
  }
  const payload: CanonicalLogPayload = {
    message,
    correlationId: input.callContext.correlationId,
    method: input.method,
    path: input.path,
    statusCode: input.statusCode,
    durationMs: input.durationMs,
    context,
  };
  if (input.callContext.userId !== undefined) {
    payload.userId = input.callContext.userId;
  }
  return payload;
}
