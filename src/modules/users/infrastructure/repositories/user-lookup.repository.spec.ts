import { DataSource } from 'typeorm';
import { UserEntity } from '@/modules/users/domain/entities/user.entity';
import { UserLookupRepository } from '@/modules/users/infrastructure/repositories/user-lookup.repository';

describe('UserLookupRepository', () => {
  it('returns whether the user exists', async () => {
    const exists = vi
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const getRepository = vi.fn().mockReturnValue({ exists });
    const dataSource = { getRepository } as unknown as DataSource;
    const repository = new UserLookupRepository(dataSource);

    await expect(repository.exists(1)).resolves.toBe(true);
    await expect(repository.exists(999)).resolves.toBe(false);
    expect(getRepository).toHaveBeenCalledWith(UserEntity);
    expect(exists).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
