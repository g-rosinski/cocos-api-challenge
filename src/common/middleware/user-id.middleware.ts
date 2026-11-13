import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import {
  USER_LOOKUP,
  type UserLookup,
} from '@/modules/users/application/ports/user-lookup.port';
import { getCallContext } from '@/common/logging/call-context/call-context';
import { InvalidUserIdException } from '@/common/errors/invalid-user-id.exception';
import { UserNotFoundException } from '@/common/errors/user-not-found.exception';

function parseUserId(headerValue: string | undefined): number | null {
  if (headerValue === undefined) {
    return null;
  }
  const trimmed = headerValue.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

@Injectable()
export class UserIdMiddleware implements NestMiddleware {
  constructor(
    @Inject(USER_LOOKUP)
    private readonly userLookup: UserLookup,
  ) {}

  async use(
    request: Request,
    _response: Response,
    next: NextFunction,
  ): Promise<void> {
    const userId = parseUserId(request.header('x-user-id'));
    if (userId === null) {
      throw new InvalidUserIdException();
    }
    const userExists = await this.userLookup.exists(userId);
    if (!userExists) {
      throw new UserNotFoundException();
    }
    const currentContext = getCallContext();
    if (currentContext !== undefined) {
      currentContext.userId = userId;
    }
    next();
  }
}
