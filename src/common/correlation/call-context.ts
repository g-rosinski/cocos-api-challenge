import { AsyncLocalStorage } from 'node:async_hooks';
import type { CanonicalLogAttributes } from '@/common/logging/canonical-log-attribute';

export type CallContext = {
  correlationId: string;
  userId?: number;
  title?: string;
  status?: string;
  attributes?: CanonicalLogAttributes;
};

export const callContextStorage = new AsyncLocalStorage<CallContext>();

export function getCallContext(): CallContext | undefined {
  return callContextStorage.getStore();
}
