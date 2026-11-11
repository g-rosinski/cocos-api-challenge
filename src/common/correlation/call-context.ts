import { AsyncLocalStorage } from 'node:async_hooks';

export type CallContext = {
  correlationId: string;
  userId?: number;
};

export const callContextStorage = new AsyncLocalStorage<CallContext>();

export function getCallContext(): CallContext | undefined {
  return callContextStorage.getStore();
}
