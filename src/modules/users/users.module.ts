import { Module } from '@nestjs/common';
import { USER_LOOKUP } from '@/modules/users/application/ports/user-lookup.port';
import { UserLookupRepository } from '@/modules/users/infrastructure/repositories/user-lookup.repository';

@Module({
  providers: [
    UserLookupRepository,
    {
      provide: USER_LOOKUP,
      useExisting: UserLookupRepository,
    },
  ],
  exports: [USER_LOOKUP],
})
export class UsersModule {}
