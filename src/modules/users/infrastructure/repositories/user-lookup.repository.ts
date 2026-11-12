import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { UserLookup } from '@/modules/users/application/ports/user-lookup.port';
import { UserEntity } from '@/modules/users/domain/entities/user.entity';

@Injectable()
export class UserLookupRepository implements UserLookup {
  constructor(private readonly dataSource: DataSource) {}

  async exists(userId: number): Promise<boolean> {
    return this.dataSource.getRepository(UserEntity).exists({
      where: { id: userId },
    });
  }
}
