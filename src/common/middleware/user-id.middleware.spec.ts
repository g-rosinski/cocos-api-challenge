import type { NextFunction, Request, Response } from 'express';
import { callContextStorage } from '@/common/correlation/call-context';
import { InvalidUserIdException } from '@/common/errors/invalid-user-id.exception';
import { UserNotFoundException } from '@/common/errors/user-not-found.exception';
import type { UserAccountLookup } from '@/common/accounts/user-account-lookup';
import { UserIdMiddleware } from '@/common/middleware/user-id.middleware';

describe('UserIdMiddleware', () => {
  const next: NextFunction = vi.fn();
  const response = {} as Response;

  function createRequest(header: string | undefined): Request {
    return {
      header: (name: string) => (name === 'x-user-id' ? header : undefined),
    } as Request;
  }

  it('rejects a missing header', async () => {
    const lookup: UserAccountLookup = { exists: vi.fn() };
    const middleware = new UserIdMiddleware(lookup);

    await expect(
      middleware.use(createRequest(undefined), response, next),
    ).rejects.toBeInstanceOf(InvalidUserIdException);
    expect(lookup.exists).not.toHaveBeenCalled();
  });

  it('rejects a non integer header', async () => {
    const lookup: UserAccountLookup = { exists: vi.fn() };
    const middleware = new UserIdMiddleware(lookup);

    await expect(
      middleware.use(createRequest('abc'), response, next),
    ).rejects.toBeInstanceOf(InvalidUserIdException);
  });

  it('rejects a user that does not exist', async () => {
    const lookup: UserAccountLookup = {
      exists: vi.fn().mockResolvedValue(false),
    };
    const middleware = new UserIdMiddleware(lookup);

    await expect(
      middleware.use(createRequest('999'), response, next),
    ).rejects.toBeInstanceOf(UserNotFoundException);
  });

  it('stores the user id and continues for an existing user', async () => {
    const lookup: UserAccountLookup = {
      exists: vi.fn().mockResolvedValue(true),
    };
    const middleware = new UserIdMiddleware(lookup);

    await callContextStorage.run({ correlationId: 'corr-4' }, async () => {
      await middleware.use(createRequest('1'), response, next);
      expect(callContextStorage.getStore()?.userId).toBe(1);
      expect(next).toHaveBeenCalledOnce();
    });
  });
});
