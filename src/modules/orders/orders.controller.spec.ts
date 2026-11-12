import { Test } from '@nestjs/testing';
import * as callContext from '@/common/correlation/call-context';
import { callContextStorage } from '@/common/correlation/call-context';
import { InternalException } from '@/common/errors/internal.exception';
import type { CreateOrderBody } from '@/modules/orders/application/dto/create-order-body';
import { CreateOrderService } from '@/modules/orders/application/services/create-order.service';
import type { OrderResponse } from '@/modules/orders/application/dto/order-response.types';
import { OrdersController } from '@/modules/orders/orders.controller';
import type { CreateOrderService as CreateOrderServiceType } from '@/modules/orders/application/services/create-order.service';

describe('OrdersController', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const body: CreateOrderBody = {
    instrument_id: 47,
    side: 'BUY',
    type: 'MARKET',
    size: 1,
  };

  const order: OrderResponse = {
    order_id: 14,
    user_id: 1,
    instrument_id: 47,
    side: 'BUY',
    type: 'MARKET',
    size: 1,
    price: 925.85,
    status: 'FILLED',
    datetime: '2026-11-10T13:06:00',
  };

  it('is wired through the Nest testing module', async () => {
    const module = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: CreateOrderService,
          useValue: { create: vi.fn() },
        },
      ],
    }).compile();

    expect(module.get(OrdersController)).toBeInstanceOf(OrdersController);
  });

  it('returns the created order and records canonical attributes', async () => {
    const createOrderService = {
      create: vi.fn().mockResolvedValue(order),
    } as unknown as CreateOrderServiceType;
    const controller = new OrdersController(createOrderService);

    await callContextStorage.run(
      { correlationId: 'corr-1', userId: 1 },
      async () => {
        const response = await controller.createOrder(
          '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21',
          body,
        );
        expect(response).toEqual(order);
        expect(createOrderService.create).toHaveBeenCalledWith(
          1,
          '6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21',
          body,
        );
        const store = callContextStorage.getStore();
        expect(store?.title).toBe('CreateOrder');
        expect(store?.status).toBe('FILLED');
        expect(store?.attributes).toEqual({
          instrument_id: 47,
          side: 'BUY',
          type: 'MARKET',
          order_id: 14,
        });
      },
    );
  });

  it('fails when the account middleware did not set a user', async () => {
    const createOrderService = {
      create: vi.fn(),
    } as unknown as CreateOrderServiceType;
    const controller = new OrdersController(createOrderService);

    await expect(controller.createOrder('key', body)).rejects.toBeInstanceOf(
      InternalException,
    );
    expect(createOrderService.create).not.toHaveBeenCalled();
  });

  it('returns the order when the call context is gone after the user id is read', async () => {
    const createOrderService = {
      create: vi.fn().mockResolvedValue(order),
    } as unknown as CreateOrderServiceType;
    const controller = new OrdersController(createOrderService);
    vi.spyOn(callContext, 'getCallContext')
      .mockReturnValueOnce({ correlationId: 'corr-1', userId: 1 })
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(undefined);

    await expect(
      controller.createOrder('6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21', body),
    ).resolves.toEqual(order);
  });

  it('records the order id when the context has no attributes yet', async () => {
    const createOrderService = {
      create: vi.fn().mockResolvedValue(order),
    } as unknown as CreateOrderServiceType;
    const controller = new OrdersController(createOrderService);
    const bare = { correlationId: 'corr-2', userId: 1 };
    vi.spyOn(callContext, 'getCallContext')
      .mockReturnValueOnce({ correlationId: 'corr-1', userId: 1 })
      .mockReturnValueOnce({ correlationId: 'corr-1', userId: 1 })
      .mockReturnValueOnce(bare);

    await controller.createOrder('6f1c0d4e-2a1b-4c77-9d2a-1b6e0a9c4f21', body);

    expect(bare).toMatchObject({
      status: 'FILLED',
      attributes: {
        order_id: 14,
        side: 'BUY',
        type: 'MARKET',
      },
    });
  });
});
