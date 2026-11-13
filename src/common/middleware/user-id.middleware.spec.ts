import type { NextFunction, Request, Response } from 'express';
import { callContextStorage } from '@/common/logging/call-context/call-context';
import { InvalidUserIdException } from '@/common/errors/invalid-user-id.exception';
import { UserNotFoundException } from '@/common/errors/user-not-found.exception';
import type { UserLookup } from '@/modules/users/application/ports/user-lookup.port';
import { UserIdMiddleware } from '@/common/middleware/user-id.middleware';

describe('UserIdMiddleware', () => {
  const next: NextFunction = vi.fn();
  const response = {} as Response;

  beforeEach(() => {
    vi.mocked(next).mockClear();
  });

  function createRequest(header: string | undefined): Request {
    return {
      header: (name: string) => (name === 'x-user-id' ? header : undefined),
    } as Request;
  }

  it('rejects a missing header', async () => {
    const lookup: UserLookup = { exists: vi.fn() };
    const middleware = new UserIdMiddleware(lookup);

    await expect(
      middleware.use(createRequest(undefined), response, next),
    ).rejects.toBeInstanceOf(InvalidUserIdException);
    expect(lookup.exists).not.toHaveBeenCalled();
  });

  it.each([
    { header: '', label: 'empty' },
    { header: '   ', label: 'whitespace' },
    { header: '0', label: 'zero' },
    { header: '-1', label: 'negative' },
    { header: 'abc', label: 'non integer' },
  ])('rejects $label x-user-id', async ({ header }) => {
    const lookup: UserLookup = { exists: vi.fn() };
    const middleware = new UserIdMiddleware(lookup);

    await expect(
      middleware.use(createRequest(header), response, next),
    ).rejects.toBeInstanceOf(InvalidUserIdException);
    expect(lookup.exists).not.toHaveBeenCalled();
  });

  it('rejects a user that does not exist', async () => {
    const lookup: UserLookup = {
      exists: vi.fn().mockResolvedValue(false),
    };
    const middleware = new UserIdMiddleware(lookup);

    await expect(
      middleware.use(createRequest('999'), response, next),
    ).rejects.toBeInstanceOf(UserNotFoundException);
  });

  it('stores the user id and continues for an existing user', async () => {
    const lookup: UserLookup = {
      exists: vi.fn().mockResolvedValue(true),
    };
    const middleware = new UserIdMiddleware(lookup);

    await callContextStorage.run({ correlationId: 'corr-4' }, async () => {
      await middleware.use(createRequest('1'), response, next);
      expect(callContextStorage.getStore()?.userId).toBe(1);
      expect(next).toHaveBeenCalledOnce();
    });
  });

  it('continues without enriching context when the store is missing', async () => {
    const lookup: UserLookup = {
      exists: vi.fn().mockResolvedValue(true),
    };
    const middleware = new UserIdMiddleware(lookup);

    await middleware.use(createRequest('1'), response, next);

    expect(lookup.exists).toHaveBeenCalledWith(1);
    expect(next).toHaveBeenCalledOnce();
  });

  it('accepts a positive integer user id', async () => {
    const lookup: UserLookup = {
      exists: vi.fn().mockResolvedValue(true),
    };
    const middleware = new UserIdMiddleware(lookup);

    await callContextStorage.run({ correlationId: 'corr-5' }, async () => {
      await middleware.use(createRequest('999'), response, next);
      expect(callContextStorage.getStore()?.userId).toBe(999);
    });
  });
});
