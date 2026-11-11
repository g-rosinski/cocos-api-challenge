export interface UserAccountLookup {
  exists(userId: number): Promise<boolean>;
}

export const USER_ACCOUNT_LOOKUP = Symbol('USER_ACCOUNT_LOOKUP');
