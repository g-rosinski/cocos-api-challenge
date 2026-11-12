import { InternalException } from '@/common/errors/internal.exception';
import { requireCallContextUserId } from '@/common/correlation/require-call-context-user-id';

describe('requireCallContextUserId', () => {
  it('throws when context is missing', () => {
    expect(() => requireCallContextUserId(undefined)).toThrow(
      InternalException,
    );
  });

  it('throws when user id is missing on the store', () => {
    expect(() => requireCallContextUserId({ correlationId: 'corr-1' })).toThrow(
      InternalException,
    );
  });

  it('throws when user id is explicitly undefined', () => {
    expect(() =>
      requireCallContextUserId({ correlationId: 'corr-1', userId: undefined }),
    ).toThrow(InternalException);
  });

  it('returns the user id when present', () => {
    expect(
      requireCallContextUserId({ correlationId: 'corr-1', userId: 42 }),
    ).toBe(42);
  });
});
