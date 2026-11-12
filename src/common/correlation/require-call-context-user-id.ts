import type { CallContext } from '@/common/correlation/call-context';
import { InternalException } from '@/common/errors/internal.exception';

export function requireCallContextUserId(
  context: CallContext | undefined,
): number {
  const userId = context?.userId;
  if (userId === undefined) {
    throw new InternalException();
  }
  return userId;
}
