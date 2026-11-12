import { DataSource, QueryFailedError } from 'typeorm';
import { OrderSide, OrderStatus, OrderType } from '@/domain/order-types';
import { DependencyException } from '@/common/errors/dependency.exception';
import { UserNotFoundException } from '@/common/errors/user-not-found.exception';
import { IdempotencyConflictError } from '@/modules/orders/domain/idempotency-conflict.error';
import { TypeOrmOrderTransactionAdapter } from '@/modules/orders/infrastructure/repositories/typeorm-order-transaction.adapter';

type QueryRunnerDouble = {
  connect: ReturnType<typeof vi.fn>;
  startTransaction: ReturnType<typeof vi.fn>;
  commitTransaction: ReturnType<typeof vi.fn>;
  rollbackTransaction: ReturnType<typeof vi.fn>;
  release: ReturnType<typeof vi.fn>;
  query: ReturnType<typeof vi.fn>;
};

function queryRunnerDouble(): QueryRunnerDouble {
  return {
    connect: vi.fn().mockResolvedValue(undefined),
    startTransaction: vi.fn().mockResolvedValue(undefined),
    commitTransaction: vi.fn().mockResolvedValue(undefined),
    rollbackTransaction: vi.fn().mockResolvedValue(undefined),
    release: vi.fn().mockResolvedValue(undefined),
    query: vi.fn(),
  };
}

function adapterWith(
  runner: QueryRunnerDouble,
  query: ReturnType<typeof vi.fn> = vi.fn(),
): TypeOrmOrderTransactionAdapter {
  const dataSource = {
    createQueryRunner: () => runner,
    query,
  } as unknown as DataSource;
  return new TypeOrmOrderTransactionAdapter(dataSource);
}

const storedRow = {
  payload_hash: 'abc',
  id: 14,
  instrumentid: 47,
  userid: '1',
  size: 1,
  price: '925.85',
  type: OrderType.MARKET,
  side: OrderSide.BUY,
  status: OrderStatus.FILLED,
  datetime: '2026-11-10 13:06:00',
};

describe('TypeOrmOrderTransactionAdapter', () => {
  it('maps an idempotency row into the stored order', async () => {
    const query = vi.fn().mockResolvedValue([storedRow]);
    const adapter = adapterWith(queryRunnerDouble(), query);

    await expect(adapter.findIdempotency(1, 'key')).resolves.toEqual({
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
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('order_idempotency_keys'),
      [1, 'key'],
    );
  });

  it('returns null when the key is new', async () => {
    const adapter = adapterWith(
      queryRunnerDouble(),
      vi.fn().mockResolvedValue([]),
    );

    await expect(adapter.findIdempotency(1, 'key')).resolves.toBeNull();
  });

  it('rejects a row that is not an order this API stores', async () => {
    const adapter = adapterWith(
      queryRunnerDouble(),
      vi.fn().mockResolvedValue([{ ...storedRow, side: OrderSide.CASH_IN }]),
    );

    await expect(adapter.findIdempotency(1, 'key')).rejects.toBeInstanceOf(
      DependencyException,
    );
  });

  it('rejects a driver payload that is not a row list', async () => {
    const adapter = adapterWith(
      queryRunnerDouble(),
      vi.fn().mockResolvedValue({ rows: [] }),
    );

    await expect(adapter.findIdempotency(1, 'key')).rejects.toBeInstanceOf(
      DependencyException,
    );
  });

  it('locks the account, runs the work and commits', async () => {
    const runner = queryRunnerDouble();
    runner.query.mockResolvedValueOnce([{ id: 1 }]);
    const adapter = adapterWith(runner);

    await expect(adapter.runInTransaction(1, async () => 'done')).resolves.toBe(
      'done',
    );
    expect(runner.query).toHaveBeenCalledWith(
      expect.stringContaining('FOR UPDATE'),
      [1],
    );
    expect(runner.commitTransaction).toHaveBeenCalledOnce();
    expect(runner.rollbackTransaction).not.toHaveBeenCalled();
    expect(runner.release).toHaveBeenCalledOnce();
  });

  it('rolls back when the account row is missing', async () => {
    const runner = queryRunnerDouble();
    runner.query.mockResolvedValueOnce([]);
    const adapter = adapterWith(runner);

    await expect(
      adapter.runInTransaction(9, async () => 'done'),
    ).rejects.toBeInstanceOf(UserNotFoundException);
    expect(runner.rollbackTransaction).toHaveBeenCalledOnce();
    expect(runner.commitTransaction).not.toHaveBeenCalled();
    expect(runner.release).toHaveBeenCalledOnce();
  });

  it('rolls back when the work fails', async () => {
    const runner = queryRunnerDouble();
    runner.query.mockResolvedValueOnce([{ id: 1 }]);
    const adapter = adapterWith(runner);

    await expect(
      adapter.runInTransaction(1, async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(runner.rollbackTransaction).toHaveBeenCalledOnce();
    expect(runner.commitTransaction).not.toHaveBeenCalled();
  });

  it('turns a unique idempotency violation into a conflict and rolls back', async () => {
    const runner = queryRunnerDouble();
    const duplicate = new QueryFailedError(
      'INSERT',
      [],
      Object.assign(new Error('duplicate'), { code: '23505' }),
    );
    runner.query
      .mockResolvedValueOnce([{ id: 1 }])
      .mockRejectedValueOnce(duplicate);
    const adapter = adapterWith(runner);

    await expect(
      adapter.runInTransaction(1, (context) =>
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

  it('keeps other database failures as query errors', async () => {
    const runner = queryRunnerDouble();
    const failure = new QueryFailedError(
      'INSERT',
      [],
      Object.assign(new Error('null'), { code: '23502' }),
    );
    runner.query
      .mockResolvedValueOnce([{ id: 1 }])
      .mockRejectedValueOnce(failure);
    const adapter = adapterWith(runner);

    await expect(
      adapter.runInTransaction(1, (context) =>
        context.insertIdempotency({
          userId: 1,
          idempotencyKey: '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21',
          orderId: 14,
          payloadHash: 'abc',
        }),
      ),
    ).rejects.toBe(failure);
  });

  it('maps the inserted order and an empty close', async () => {
    const runner = queryRunnerDouble();
    runner.query
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ close: null }])
      .mockResolvedValueOnce([
        {
          instrumentid: 47,
          size: '40',
          price: 900,
          side: OrderSide.BUY,
          status: OrderStatus.FILLED,
          type: OrderType.MARKET,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 15,
          instrumentid: 45,
          userid: 1,
          size: 1,
          price: '710.00',
          type: OrderType.LIMIT,
          side: OrderSide.BUY,
          status: OrderStatus.NEW,
          datetime: new Date('2026-11-10T13:06:00.000Z'),
        },
      ]);
    const adapter = adapterWith(runner);

    const created = await adapter.runInTransaction(1, async (context) => {
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

  it('reads the key, the instrument and the close inside the lock', async () => {
    const runner = queryRunnerDouble();
    runner.query
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([
        {
          ...storedRow,
          side: OrderSide.SELL,
          type: OrderType.LIMIT,
          status: OrderStatus.REJECTED,
          price: 710,
          datetime: new Date('2026-11-10T13:06:00.000Z'),
        },
      ])
      .mockResolvedValueOnce([{ id: '45', type: 'ACCIONES' }])
      .mockResolvedValueOnce([{ close: '925.85' }])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([]);
    const adapter = adapterWith(runner);

    const snapshot = await adapter.runInTransaction(1, async (context) => {
      const stored = await context.findIdempotency(1, 'key');
      const instrument = await context.loadInstrument(45);
      const close = await context.loadLatestClose(47);
      const missingClose = await context.loadLatestClose(45);
      const noCloseRow = await context.loadLatestClose(46);
      return { stored, instrument, close, missingClose, noCloseRow };
    });

    expect(snapshot.stored?.order).toMatchObject({
      side: OrderSide.SELL,
      type: OrderType.LIMIT,
      status: OrderStatus.REJECTED,
      price: 710,
    });
    expect(snapshot.instrument).toEqual({ id: 45, type: 'ACCIONES' });
    expect(snapshot.close).toBe(925.85);
    expect(snapshot.missingClose).toBeNull();
    expect(snapshot.noCloseRow).toBeNull();
  });

  it.each([
    ['a row that is not an object', [null]],
    ['a non-finite number', [{ ...storedRow, id: Number.POSITIVE_INFINITY }]],
    ['a blank numeric string', [{ ...storedRow, size: '   ' }]],
    ['a numeric string that is not a number', [{ ...storedRow, id: 'nope' }]],
    ['an empty text column', [{ ...storedRow, payload_hash: '' }]],
    ['a text column that is not text', [{ ...storedRow, payload_hash: 12 }]],
    ['an unknown order type', [{ ...storedRow, type: 'STOP' }]],
    ['an unknown order status', [{ ...storedRow, status: 'PENDING' }]],
    ['a datetime that is not a timestamp', [{ ...storedRow, datetime: 1 }]],
    [
      'a datetime string that cannot be read',
      [{ ...storedRow, datetime: 'ayer' }],
    ],
  ])('rejects %s', async (_name, rows) => {
    const adapter = adapterWith(
      queryRunnerDouble(),
      vi.fn().mockResolvedValue(rows),
    );

    await expect(adapter.findIdempotency(1, 'key')).rejects.toBeInstanceOf(
      DependencyException,
    );
  });

  it('rethrows a failure that is not a unique violation', async () => {
    const runner = queryRunnerDouble();
    const failure = new Error('network');
    runner.query
      .mockResolvedValueOnce([{ id: 1 }])
      .mockRejectedValueOnce(failure);
    const adapter = adapterWith(runner);

    await expect(
      adapter.runInTransaction(1, (context) =>
        context.insertIdempotency({
          userId: 1,
          idempotencyKey: '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21',
          orderId: 14,
          payloadHash: 'abc',
        }),
      ),
    ).rejects.toBe(failure);
  });

  it('rethrows a query failure whose driver error has no code', async () => {
    const runner = queryRunnerDouble();
    const failure = new QueryFailedError('INSERT', [], new Error('constraint'));
    runner.query
      .mockResolvedValueOnce([{ id: 1 }])
      .mockRejectedValueOnce(failure);
    const adapter = adapterWith(runner);

    await expect(
      adapter.runInTransaction(1, (context) =>
        context.insertIdempotency({
          userId: 1,
          idempotencyKey: '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21',
          orderId: 14,
          payloadHash: 'abc',
        }),
      ),
    ).rejects.toBe(failure);
  });

  it('rethrows a query failure whose driver error is not an object', async () => {
    const runner = queryRunnerDouble();
    const failure = new QueryFailedError(
      'INSERT',
      [],
      'duplicate' as unknown as Error,
    );
    runner.query
      .mockResolvedValueOnce([{ id: 1 }])
      .mockRejectedValueOnce(failure);
    const adapter = adapterWith(runner);

    await expect(
      adapter.runInTransaction(1, (context) =>
        context.insertIdempotency({
          userId: 1,
          idempotencyKey: '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21',
          orderId: 14,
          payloadHash: 'abc',
        }),
      ),
    ).rejects.toBe(failure);
  });

  it('fails when the insert returns no row', async () => {
    const runner = queryRunnerDouble();
    runner.query.mockResolvedValueOnce([{ id: 1 }]).mockResolvedValueOnce([]);
    const adapter = adapterWith(runner);

    await expect(
      adapter.runInTransaction(1, (context) =>
        context.insertOrder({
          userId: 1,
          instrumentId: 47,
          side: OrderSide.BUY,
          type: OrderType.MARKET,
          size: 1,
          price: 925.85,
          status: OrderStatus.FILLED,
        }),
      ),
    ).rejects.toBeInstanceOf(DependencyException);
  });
});
