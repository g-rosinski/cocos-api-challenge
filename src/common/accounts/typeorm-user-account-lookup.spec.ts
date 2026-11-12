import { DataSource } from 'typeorm';
import { TypeOrmUserAccountLookup } from '@/common/accounts/typeorm-user-account-lookup';

describe('TypeOrmUserAccountLookup', () => {
  it('returns whether the account exists', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce([{ exists: true }])
      .mockResolvedValueOnce([{ exists: false }]);
    const dataSource = { query } as unknown as DataSource;
    const lookup = new TypeOrmUserAccountLookup(dataSource);

    await expect(lookup.exists(1)).resolves.toBe(true);
    await expect(lookup.exists(999)).resolves.toBe(false);
    expect(query).toHaveBeenCalledWith(
      'SELECT EXISTS(SELECT 1 FROM users WHERE id = $1) AS "exists"',
      [1],
    );
  });
});
