import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { UserAccountLookup } from './user-account-lookup.js';

type ExistsRow = {
  exists: boolean;
};

@Injectable()
export class TypeOrmUserAccountLookup implements UserAccountLookup {
  constructor(private readonly dataSource: DataSource) {}

  async exists(userId: number): Promise<boolean> {
    const rows: ExistsRow[] = await this.dataSource.query(
      'SELECT EXISTS(SELECT 1 FROM users WHERE id = $1) AS "exists"',
      [userId],
    );
    return rows[0]?.exists === true;
  }
}
