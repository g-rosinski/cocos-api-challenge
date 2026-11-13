export interface UserLookup {
  exists(userId: number): Promise<boolean>;
}

export const USER_LOOKUP = Symbol('USER_LOOKUP');
