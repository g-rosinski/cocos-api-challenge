import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import {
  USER_ACCOUNT_LOOKUP,
  type UserAccountLookup,
} from '@/common/accounts/user-account-lookup';
import { getCallContext } from '@/common/correlation/call-context';
import { InvalidUserIdException } from '@/common/errors/invalid-user-id.exception';
import { UserNotFoundException } from '@/common/errors/user-not-found.exception';
import { parseUserId } from '@/common/middleware/parse-user-id';

@Injectable()
export class UserIdMiddleware implements NestMiddleware {
  constructor(
    @Inject(USER_ACCOUNT_LOOKUP)
    private readonly userAccountLookup: UserAccountLookup,
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
    const accountExists = await this.userAccountLookup.exists(userId);
    if (!accountExists) {
      throw new UserNotFoundException();
    }
    const currentContext = getCallContext();
    if (currentContext !== undefined) {
      currentContext.userId = userId;
    }
    next();
  }
}
