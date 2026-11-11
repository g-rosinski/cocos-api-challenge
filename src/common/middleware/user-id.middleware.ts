import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import {
  USER_ACCOUNT_LOOKUP,
  type UserAccountLookup,
} from '../accounts/user-account-lookup.js';
import { getCallContext } from '../correlation/call-context.js';
import { InvalidUserIdException } from '../errors/invalid-user-id.exception.js';
import { UserNotFoundException } from '../errors/user-not-found.exception.js';
import { parseUserId } from './parse-user-id.js';

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
