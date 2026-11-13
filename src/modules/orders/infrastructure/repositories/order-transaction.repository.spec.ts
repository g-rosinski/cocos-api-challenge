import { DataSource, QueryFailedError } from 'typeorm';
import { OrderSide, OrderStatus, OrderType } from '@/domain/order-types';
import { DependencyException } from '@/common/errors/dependency.exception';
import { UserNotFoundException } from '@/common/errors/user-not-found.exception';
import { IdempotencyConflictError } from '@/modules/orders/domain/idempotency-conflict.error';
import { InstrumentEntity } from '@/modules/instruments/domain/entities/instrument.entity';
import { MarketDataEntity } from '@/modules/instruments/domain/entities/market-data.entity';
import { OrderEntity } from '@/modules/orders/domain/entities/order.entity';
import { OrderIdempotencyKeyEntity } from '@/modules/orders/domain/entities/order-idempotency-key.entity';
import { UserEntity } from '@/modules/users/domain/entities/user.entity';
import { OrderTransactionRepository } from '@/modules/orders/infrastructure/repositories/order-transaction.repository';

type ManagerMock = {
  findOne: ReturnType<typeof vi.fn>;
  find: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
};

type QueryRunnerDouble = {
  connect: ReturnType<typeof vi.fn>;
  startTransaction: ReturnType<typeof vi.fn>;
  commitTransaction: ReturnType<typeof vi.fn>;
  rollbackTransaction: ReturnType<typeof vi.fn>;
  release: ReturnType<typeof vi.fn>;
  manager: ManagerMock;
};

function managerMock(): ManagerMock {
  return {
    findOne: vi.fn().mockResolvedValue(null),
    find: vi.fn().mockResolvedValue([]),
    create: vi.fn((_entity, data: unknown) => data),
    save: vi.fn(async (entity: OrderEntity) => entity),
  };
}

function queryRunnerDouble(
  manager: ManagerMock = managerMock(),
): QueryRunnerDouble {
  return {
    connect: vi.fn().mockResolvedValue(undefined),
    startTransaction: vi.fn().mockResolvedValue(undefined),
    commitTransaction: vi.fn().mockResolvedValue(undefined),
    rollbackTransaction: vi.fn().mockResolvedValue(undefined),
    release: vi.fn().mockResolvedValue(undefined),
    manager,
  };
}

function repositoryWith(
  runner: QueryRunnerDouble,
  rootManager?: ManagerMock,
): OrderTransactionRepository {
  const dataSource = {
    createQueryRunner: () => runner,
    manager: rootManager ?? runner.manager,
  } as unknown as DataSource;
  return new OrderTransactionRepository(dataSource);
}

const storedOrder: OrderEntity = {
  id: 14,
  instrumentId: 47,
  userId: 1,
  size: 1,
  price: 925.85,
  type: OrderType.MARKET,
  side: OrderSide.BUY,
  status: OrderStatus.FILLED,
  datetime: new Date('2026-11-10T13:06:00.000Z'),
};

describe('OrderTransactionRepository', () => {
  it('maps an idempotency row into the stored order', async () => {
    const manager = managerMock();
    manager.findOne.mockResolvedValue({
      payloadHash: 'abc',
      order: storedOrder,
    });
    const repository = repositoryWith(queryRunnerDouble(), manager);

    await expect(repository.findIdempotency(1, 'key')).resolves.toEqual({
      payloadHash: 'abc',
      order: {
        order_id: 14,
        user_id: 1,
        instrument_id: 47,
        side: OrderSide.BUY,
        type: OrderType.MARKET,
        size: 1,
        price: 925.85,
        status: OrderStatus.FILLED,
        datetime: '2026-11-10T13:06:00',
      },
    });
    expect(manager.findOne).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        where: { userId: 1, idempotencyKey: 'key' },
        relations: { order: true },
      }),
    );
  });

  it('returns null when the key is new', async () => {
    const manager = managerMock();
    const repository = repositoryWith(queryRunnerDouble(), manager);
    await expect(repository.findIdempotency(1, 'key')).resolves.toBeNull();
  });

  it('returns null when the idempotency row has no related order', async () => {
    const manager = managerMock();
    manager.findOne.mockResolvedValue({
      payloadHash: 'abc',
      order: undefined,
    });
    const repository = repositoryWith(queryRunnerDouble(), manager);

    await expect(repository.findIdempotency(1, 'key')).resolves.toBeNull();
  });

  it('rejects a row that is not an order this API stores', async () => {
    const manager = managerMock();
    manager.findOne.mockResolvedValue({
      payloadHash: 'abc',
      order: { ...storedOrder, side: OrderSide.CASH_IN },
    });
    const repository = repositoryWith(queryRunnerDouble(), manager);

    await expect(repository.findIdempotency(1, 'key')).rejects.toBeInstanceOf(
      DependencyException,
    );
  });

  it('locks the account, runs the work and commits', async () => {
    const manager = managerMock();
    manager.findOne.mockImplementation(async (target: unknown) => {
      if (target === UserEntity) {
        return { id: 1 };
      }
      return null;
    });
    const runner = queryRunnerDouble(manager);
    const repository = repositoryWith(runner);

    await expect(
      repository.runInTransaction(1, async () => 'done'),
    ).resolves.toBe('done');
    expect(manager.findOne).toHaveBeenCalledWith(UserEntity, {
      where: { id: 1 },
      lock: { mode: 'pessimistic_write' },
    });
    expect(runner.commitTransaction).toHaveBeenCalledOnce();
    expect(runner.rollbackTransaction).not.toHaveBeenCalled();
    expect(runner.release).toHaveBeenCalledOnce();
  });

  it('rolls back when the account row is missing', async () => {
    const manager = managerMock();
    const runner = queryRunnerDouble(manager);
    const repository = repositoryWith(runner);

    await expect(
      repository.runInTransaction(9, async () => 'done'),
    ).rejects.toBeInstanceOf(UserNotFoundException);
    expect(runner.rollbackTransaction).toHaveBeenCalledOnce();
    expect(runner.commitTransaction).not.toHaveBeenCalled();
    expect(runner.release).toHaveBeenCalledOnce();
  });

  it('rolls back when the work fails', async () => {
    const manager = managerMock();
    manager.findOne.mockResolvedValue({ id: 1 });
    const runner = queryRunnerDouble(manager);
    const repository = repositoryWith(runner);

    await expect(
      repository.runInTransaction(1, async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(runner.rollbackTransaction).toHaveBeenCalledOnce();
    expect(runner.commitTransaction).not.toHaveBeenCalled();
  });

  it('rethrows a postgres error that is not a unique violation', async () => {
    const manager = managerMock();
    const other = new QueryFailedError(
      'INSERT',
      [],
      Object.assign(new Error('check failed'), { code: '23514' }),
    );
    manager.findOne.mockResolvedValue({ id: 1 });
    manager.save.mockRejectedValueOnce(other);
    const runner = queryRunnerDouble(manager);
    const repository = repositoryWith(runner);

    await expect(
      repository.runInTransaction(1, (context) =>
        context.insertIdempotency({
          userId: 1,
          idempotencyKey: '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21',
          orderId: 14,
          payloadHash: 'abc',
        }),
      ),
    ).rejects.toBe(other);
  });

  it('rethrows a non-unique save failure from idempotency insert', async () => {
    const manager = managerMock();
    manager.findOne.mockResolvedValue({ id: 1 });
    manager.save.mockRejectedValueOnce(new Error('db down'));
    const runner = queryRunnerDouble(manager);
    const repository = repositoryWith(runner);

    await expect(
      repository.runInTransaction(1, (context) =>
        context.insertIdempotency({
          userId: 1,
          idempotencyKey: '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21',
          orderId: 14,
          payloadHash: 'abc',
        }),
      ),
    ).rejects.toThrow('db down');
    expect(runner.rollbackTransaction).toHaveBeenCalledOnce();
  });

  it('turns a unique idempotency violation into a conflict and rolls back', async () => {
    const manager = managerMock();
    const duplicate = new QueryFailedError(
      'INSERT',
      [],
      Object.assign(new Error('duplicate'), { code: '23505' }),
    );
    manager.findOne.mockResolvedValue({ id: 1 });
    manager.save.mockRejectedValueOnce(duplicate);
    const runner = queryRunnerDouble(manager);
    const repository = repositoryWith(runner);

    await expect(
      repository.runInTransaction(1, (context) =>
        context.insertIdempotency({
          userId: 1,
          idempotencyKey: '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21',
          orderId: 14,
          payloadHash: 'abc',
        }),
      ),
    ).rejects.toBeInstanceOf(IdempotencyConflictError);
    expect(runner.rollbackTransaction).toHaveBeenCalledOnce();
    expect(runner.commitTransaction).not.toHaveBeenCalled();
  });

  it('loads an instrument, a close and idempotency via the transaction context', async () => {
    const manager = managerMock();
    manager.findOne.mockImplementation(async (target: unknown) => {
      if (target === UserEntity) {
        return { id: 1 };
      }
      if (target === InstrumentEntity) {
        return { id: 45, type: 'ACCIONES' };
      }
      if (target === MarketDataEntity) {
        return { close: 710.12, instrumentId: 45, id: 1, date: '2026-11-10' };
      }
      if (target === OrderIdempotencyKeyEntity) {
        return { payloadHash: 'stored', order: storedOrder };
      }
      return null;
    });
    const runner = queryRunnerDouble(manager);
    const repository = repositoryWith(runner);

    await repository.runInTransaction(1, async (context) => {
      expect(await context.findIdempotency(1, 'stored-key')).toEqual({
        payloadHash: 'stored',
        order: expect.objectContaining({ order_id: 14 }),
      });
      expect(await context.loadInstrument(45)).toEqual({
        id: 45,
        type: 'ACCIONES',
      });
      expect(await context.loadLatestClose(45)).toBe(710.12);
    });
    expect(runner.commitTransaction).toHaveBeenCalledOnce();
  });

  it('maps the inserted order and an empty close', async () => {
    const manager = managerMock();
    manager.findOne.mockImplementation(async (target: unknown) => {
      if (target === UserEntity) {
        return { id: 1 };
      }
      if (target === InstrumentEntity) {
        return null;
      }
      if (target === MarketDataEntity) {
        return null;
      }
      return null;
    });
    manager.find.mockResolvedValue([
      {
        instrumentId: 47,
        size: 40,
        price: 900,
        side: OrderSide.BUY,
        status: OrderStatus.FILLED,
        type: OrderType.MARKET,
      },
    ]);
    manager.save.mockResolvedValue({
      id: 15,
      instrumentId: 45,
      userId: 1,
      size: 1,
      price: 710,
      type: OrderType.LIMIT,
      side: OrderSide.BUY,
      status: OrderStatus.NEW,
      datetime: new Date('2026-11-10T13:06:00.000Z'),
    });
    const runner = queryRunnerDouble(manager);
    const repository = repositoryWith(runner);

    const created = await repository.runInTransaction(1, async (context) => {
      expect(await context.loadInstrument(45)).toBeNull();
      expect(await context.loadLatestClose(45)).toBeNull();
      expect(await context.loadOrders(1)).toEqual([
        {
          instrumentId: 47,
          size: 40,
          price: 900,
          side: OrderSide.BUY,
          status: OrderStatus.FILLED,
          type: OrderType.MARKET,
        },
      ]);
      return context.insertOrder({
        userId: 1,
        instrumentId: 45,
        side: OrderSide.BUY,
        type: OrderType.LIMIT,
        size: 1,
        price: 710,
        status: OrderStatus.NEW,
      });
    });

    expect(created).toEqual({
      order_id: 15,
      user_id: 1,
      instrument_id: 45,
      side: OrderSide.BUY,
      type: OrderType.LIMIT,
      size: 1,
      price: 710,
      status: OrderStatus.NEW,
      datetime: '2026-11-10T13:06:00',
    });
    expect(runner.commitTransaction).toHaveBeenCalledOnce();
  });

  it.each([
    ['an unknown order type', { type: 'STOP' }],
    ['an unknown order status', { status: 'PENDING' }],
    ['a datetime that is not a timestamp', { datetime: new Date('invalid') }],
  ])('rejects %s', async (_name, overrides) => {
    const manager = managerMock();
    manager.findOne.mockResolvedValue({
      payloadHash: 'abc',
      order: { ...storedOrder, ...overrides },
    });
    const repository = repositoryWith(queryRunnerDouble(), manager);

    await expect(repository.findIdempotency(1, 'key')).rejects.toBeInstanceOf(
      DependencyException,
    );
  });
});
