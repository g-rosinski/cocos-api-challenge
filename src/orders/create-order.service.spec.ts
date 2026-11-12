import { Logger } from '@nestjs/common';
import { callContextStorage } from '@/common/correlation/call-context';
import { IdempotencyKeyMismatchException } from '@/common/errors/idempotency-key-mismatch.exception';
import { InstrumentNotFoundException } from '@/common/errors/instrument-not-found.exception';
import { InstrumentNotTradableException } from '@/common/errors/instrument-not-tradable.exception';
import { InternalException } from '@/common/errors/internal.exception';
import { PriceUnavailableException } from '@/common/errors/price-unavailable.exception';
import type { CreateOrderBody } from '@/orders/create-order-body';
import { CreateOrderService } from '@/orders/create-order.service';
import { IdempotencyConflictError } from '@/orders/domain/idempotency-conflict.error';
import { IllegalOrderTransitionError } from '@/orders/domain/illegal-order-transition.error';
import { OrderStateMachine } from '@/orders/domain/order-state-machine';
import type { OrderResponse } from '@/orders/order-response.types';
import { OrderStrategyFactory } from '@/orders/order-strategy.factory';
import type {
  LockedOrderContext,
  OrderTransactionPort,
  StoredIdempotency,
} from '@/orders/ports/order-transaction.port';

const marketBuy: CreateOrderBody = {
  instrument_id: 47,
  side: 'BUY',
  type: 'MARKET',
  size: 1,
};

function response(overrides: Partial<OrderResponse> = {}): OrderResponse {
  return {
    order_id: 14,
    user_id: 1,
    instrument_id: 47,
    side: 'BUY',
    type: 'MARKET',
    size: 1,
    price: 925.85,
    status: 'FILLED',
    datetime: '2026-11-10T13:06:00',
    ...overrides,
  };
}

function stored(order = response(), payloadHash = 'hash-a'): StoredIdempotency {
  return { payloadHash, order };
}

describe('CreateOrderService', () => {
  const strategies = new OrderStrategyFactory();
  const stateMachine = new OrderStateMachine();

  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function serviceWith(port: OrderTransactionPort): CreateOrderService {
    return new CreateOrderService(port, strategies, stateMachine);
  }

  async function withContext<T>(run: () => Promise<T>): Promise<T> {
    return callContextStorage.run({ correlationId: 'corr-order' }, run);
  }

  it('places a filled market buy and logs outside the lock', async () => {
    const log = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    let logsDuringLock = 0;
    const inserted: OrderResponse[] = [];
    const keys: string[] = [];
    const context: LockedOrderContext = {
      findIdempotency: vi.fn().mockResolvedValue(null),
      loadInstrument: vi.fn().mockResolvedValue({ id: 47, type: 'ACCIONES' }),
      loadLatestClose: vi.fn().mockResolvedValue(925.85),
      loadOrders: vi.fn().mockResolvedValue([
        {
          instrumentId: 66,
          size: 628425.85,
          price: 1,
          side: 'CASH_IN',
          status: 'FILLED',
          type: 'MARKET',
        },
      ]),
      insertOrder: vi.fn().mockImplementation(async (order) => {
        const created = response({
          size: order.size,
          price: order.price,
          status: order.status,
          side: order.side,
          type: order.type,
        });
        inserted.push(created);
        return created;
      }),
      insertIdempotency: vi.fn().mockImplementation(async (record) => {
        keys.push(record.payloadHash);
      }),
    };
    const port: OrderTransactionPort = {
      findIdempotency: vi.fn().mockResolvedValue(null),
      runInTransaction: vi.fn(async (_userId, work) => {
        const before = log.mock.calls.length;
        const result = await work(context);
        logsDuringLock = log.mock.calls.length - before;
        return result;
      }),
    };
    const service = serviceWith(port);

    const order = await withContext(() =>
      service.create(1, '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21', marketBuy),
    );

    expect(order.status).toBe('FILLED');
    expect(order.price).toBe(925.85);
    expect(inserted[0]?.status).toBe('FILLED');
    expect(keys).toHaveLength(1);
    expect(logsDuringLock).toBe(0);
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('"event":"order_received"'),
    );
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('"result":"FILLED"'),
    );
  });

  it('returns the stored order when the key and hash match', async () => {
    const saved = response();
    const port: OrderTransactionPort = {
      findIdempotency: vi.fn().mockImplementation(async () => {
        const { canonicalOrderPayloadHash } =
          await import('@/orders/domain/canonical-order-payload');
        return stored(saved, canonicalOrderPayloadHash(marketBuy));
      }),
      runInTransaction: vi.fn(),
    };
    const service = serviceWith(port);

    const order = await withContext(() =>
      service.create(1, '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21', marketBuy),
    );

    expect(order).toEqual(saved);
    expect(port.runInTransaction).not.toHaveBeenCalled();
  });

  it('rejects a reused key with a different body before opening a transaction', async () => {
    const warn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    const port: OrderTransactionPort = {
      findIdempotency: vi.fn().mockResolvedValue(stored(response(), 'other')),
      runInTransaction: vi.fn(),
    };
    const service = serviceWith(port);

    await expect(
      withContext(() =>
        service.create(1, '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21', marketBuy),
      ),
    ).rejects.toBeInstanceOf(IdempotencyKeyMismatchException);
    expect(port.runInTransaction).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('IDEMPOTENCY_KEY_MISMATCH'),
    );
  });

  it('does not insert a currency instrument', async () => {
    const context = tradableContext({ id: 66, type: 'MONEDA' });
    const port = portThatRuns(context);
    const service = serviceWith(port);

    await expect(
      withContext(() =>
        service.create(1, '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21', marketBuy),
      ),
    ).rejects.toBeInstanceOf(InstrumentNotTradableException);
    expect(context.insertOrder).not.toHaveBeenCalled();
  });

  it('does not insert when the instrument does not exist', async () => {
    const context = tradableContext();
    context.loadInstrument.mockResolvedValue(null);
    const service = serviceWith(portThatRuns(context));

    await expect(
      withContext(() =>
        service.create(1, '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21', marketBuy),
      ),
    ).rejects.toBeInstanceOf(InstrumentNotFoundException);
    expect(context.insertOrder).not.toHaveBeenCalled();
  });

  it('does not insert a market order without a close', async () => {
    const context = tradableContext();
    context.loadLatestClose.mockResolvedValue(null);
    const service = serviceWith(portThatRuns(context));

    await expect(
      withContext(() =>
        service.create(1, '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21', marketBuy),
      ),
    ).rejects.toBeInstanceOf(PriceUnavailableException);
    expect(context.insertOrder).not.toHaveBeenCalled();
  });

  it('commits a rejected order when the amount buys no shares', async () => {
    const context = tradableContext();
    const service = serviceWith(portThatRuns(context));

    const order = await withContext(() =>
      service.create(1, '8b3c4d5e-6f70-4891-b123-c4d5e6f70891', {
        instrument_id: 47,
        side: 'BUY',
        type: 'MARKET',
        amount: 100,
      }),
    );

    expect(order.status).toBe('REJECTED');
    expect(order.size).toBe(0);
    expect(context.insertIdempotency).toHaveBeenCalled();
  });

  it('commits a rejected sell that would cross below zero', async () => {
    const context = tradableContext();
    context.loadOrders.mockResolvedValue([
      {
        instrumentId: 47,
        size: 40,
        price: 900,
        side: 'BUY',
        status: 'FILLED',
        type: 'MARKET',
      },
    ]);
    const service = serviceWith(portThatRuns(context));

    const order = await withContext(() =>
      service.create(1, '8b3c4d5e-6f70-4891-b123-c4d5e6f70891', {
        instrument_id: 47,
        side: 'SELL',
        type: 'MARKET',
        size: 1000,
      }),
    );

    expect(order).toMatchObject({
      status: 'REJECTED',
      size: 1000,
      price: 925.85,
      side: 'SELL',
    });
  });

  it('opens a limit buy without using the latest close', async () => {
    const context = tradableContext();
    const service = serviceWith(portThatRuns(context));

    const order = await withContext(() =>
      service.create(1, '7a2b3c4d-5e6f-4789-a012-b3c4d5e6f789', {
        instrument_id: 45,
        side: 'BUY',
        type: 'LIMIT',
        size: 1,
        price: 710,
      }),
    );

    expect(order).toMatchObject({
      status: 'NEW',
      price: 710,
      type: 'LIMIT',
      instrument_id: 45,
    });
    expect(context.loadLatestClose).not.toHaveBeenCalled();
  });

  it('replays the winning order after a unique key conflict', async () => {
    const saved = response({ order_id: 20 });
    const port: OrderTransactionPort = {
      findIdempotency: vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockImplementationOnce(async () => {
          const { canonicalOrderPayloadHash } =
            await import('@/orders/domain/canonical-order-payload');
          return stored(saved, canonicalOrderPayloadHash(marketBuy));
        }),
      runInTransaction: vi
        .fn()
        .mockRejectedValue(new IdempotencyConflictError()),
    };
    const service = serviceWith(port);

    await expect(
      withContext(() =>
        service.create(1, '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21', marketBuy),
      ),
    ).resolves.toEqual(saved);
  });

  it('rejects the losing request when the winning body differs', async () => {
    const port: OrderTransactionPort = {
      findIdempotency: vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(stored(response(), 'other-hash')),
      runInTransaction: vi
        .fn()
        .mockRejectedValue(new IdempotencyConflictError()),
    };
    const service = serviceWith(port);

    await expect(
      withContext(() =>
        service.create(1, '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21', marketBuy),
      ),
    ).rejects.toBeInstanceOf(IdempotencyKeyMismatchException);
  });

  it('fails when a conflict cannot be reread', async () => {
    const port: OrderTransactionPort = {
      findIdempotency: vi.fn().mockResolvedValue(null),
      runInTransaction: vi
        .fn()
        .mockRejectedValue(new IdempotencyConflictError()),
    };
    const service = serviceWith(port);

    await expect(
      withContext(() =>
        service.create(1, '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21', marketBuy),
      ),
    ).rejects.toBeInstanceOf(InternalException);
  });

  it('returns the order already stored inside the lock', async () => {
    const saved = response({ order_id: 21 });
    const context = tradableContext();
    context.findIdempotency.mockImplementation(async () => {
      const { canonicalOrderPayloadHash } =
        await import('@/orders/domain/canonical-order-payload');
      return stored(saved, canonicalOrderPayloadHash(marketBuy));
    });
    const service = serviceWith(portThatRuns(context));

    await expect(
      withContext(() =>
        service.create(1, '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21', marketBuy),
      ),
    ).resolves.toEqual(saved);
    expect(context.insertOrder).not.toHaveBeenCalled();
  });

  it('uses an empty correlation id when the call has no context', async () => {
    const log = vi.spyOn(Logger.prototype, 'log');
    const saved = response();
    const port: OrderTransactionPort = {
      findIdempotency: vi.fn().mockImplementation(async () => {
        const { canonicalOrderPayloadHash } =
          await import('@/orders/domain/canonical-order-payload');
        return stored(saved, canonicalOrderPayloadHash(marketBuy));
      }),
      runInTransaction: vi.fn(),
    };
    const service = serviceWith(port);

    await expect(
      service.create(1, '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21', marketBuy),
    ).resolves.toEqual(saved);
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('"correlationId":""'),
    );
  });

  it('logs an illegal transition as an error', async () => {
    const errorLog = vi.spyOn(Logger.prototype, 'error');
    const machine = {
      decide: () => {
        throw new IllegalOrderTransitionError('CANCELLED');
      },
    } as unknown as OrderStateMachine;
    const service = new CreateOrderService(
      portThatRuns(tradableContext()),
      strategies,
      machine,
    );

    await expect(
      withContext(() =>
        service.create(1, '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21', marketBuy),
      ),
    ).rejects.toBeInstanceOf(IllegalOrderTransitionError);
    expect(errorLog).toHaveBeenCalledWith(
      expect.stringContaining('ILLEGAL_TRANSITION'),
    );
  });
});

function tradableContext(
  instrument: { id: number; type: string } = { id: 47, type: 'ACCIONES' },
): LockedOrderContext & {
  loadInstrument: ReturnType<typeof vi.fn>;
  loadLatestClose: ReturnType<typeof vi.fn>;
  loadOrders: ReturnType<typeof vi.fn>;
  insertOrder: ReturnType<typeof vi.fn>;
  insertIdempotency: ReturnType<typeof vi.fn>;
  findIdempotency: ReturnType<typeof vi.fn>;
} {
  return {
    findIdempotency: vi.fn().mockResolvedValue(null),
    loadInstrument: vi.fn().mockResolvedValue(instrument),
    loadLatestClose: vi.fn().mockResolvedValue(925.85),
    loadOrders: vi.fn().mockResolvedValue([
      {
        instrumentId: 66,
        size: 1_000_000,
        price: 1,
        side: 'CASH_IN',
        status: 'FILLED',
        type: 'MARKET',
      },
    ]),
    insertOrder: vi.fn().mockImplementation(async (order) =>
      response({
        instrument_id: order.instrumentId,
        side: order.side,
        type: order.type,
        size: order.size,
        price: order.price,
        status: order.status,
      }),
    ),
    insertIdempotency: vi.fn().mockResolvedValue(undefined),
  };
}

function portThatRuns(context: LockedOrderContext): OrderTransactionPort {
  return {
    findIdempotency: vi.fn().mockResolvedValue(null),
    runInTransaction: vi.fn(async (_userId, work) => work(context)),
  };
}
