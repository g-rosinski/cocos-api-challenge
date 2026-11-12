import { DataSource } from 'typeorm';
import { OrderSide, OrderStatus, OrderType } from '@/domain/order-types';
import { InstrumentEntity } from '@/modules/instruments/domain/entities/instrument.entity';
import { OrderEntity } from '@/modules/orders/domain/entities/order.entity';
import { PortfolioReadRepository } from '@/modules/portfolio/infrastructure/repositories/portfolio-read.repository';

describe('PortfolioReadRepository', () => {
  it('maps database rows into portfolio calculation input', async () => {
    const orderEntity: OrderEntity = {
      id: 1,
      instrumentId: 47,
      userId: 1,
      size: 10,
      price: 930.5,
      side: OrderSide.BUY,
      status: OrderStatus.FILLED,
      type: OrderType.MARKET,
      datetime: new Date(),
    };
    const instruments: InstrumentEntity[] = [
      {
        id: 47,
        ticker: 'PAMP',
        name: 'Pampa Holding S.A.',
        type: 'ACCIONES',
      },
      { id: 66, ticker: 'ARS', name: 'PESOS', type: 'MONEDA' },
    ];
    const orderRepo = { find: vi.fn().mockResolvedValue([orderEntity]) };
    const instrumentRepo = { find: vi.fn().mockResolvedValue(instruments) };
    const query = vi.fn().mockResolvedValue([
      { instrumentid: 47, close: 925.85 },
      { instrumentid: 66, close: 1 },
    ]);
    const dataSource = {
      getRepository: vi.fn((target: unknown) => {
        if (target === OrderEntity) {
          return orderRepo;
        }
        if (target === InstrumentEntity) {
          return instrumentRepo;
        }
        throw new Error('unexpected repository');
      }),
      query,
    } as unknown as DataSource;
    const repository = new PortfolioReadRepository(dataSource);

    const input = await repository.loadCalculationInput(1);

    expect(orderRepo.find).toHaveBeenCalledWith({
      where: { userId: 1 },
      order: { datetime: 'ASC', id: 'ASC' },
    });
    expect(input.orders).toEqual([
      {
        instrumentId: 47,
        size: 10,
        price: 930.5,
        side: OrderSide.BUY,
        status: OrderStatus.FILLED,
        type: OrderType.MARKET,
      },
    ]);
    expect(input.instruments).toHaveLength(2);
    expect(input.latestCloses.get(47)).toBe(925.85);
    expect(input.latestCloses.get(66)).toBe(1);
  });

  it('keeps numeric row values when the driver already returns numbers', async () => {
    const orderRepo = { find: vi.fn().mockResolvedValue([]) };
    const instrumentRepo = { find: vi.fn().mockResolvedValue([]) };
    const query = vi.fn().mockResolvedValue([{ instrumentid: 1, close: 100 }]);
    const dataSource = {
      getRepository: vi.fn((target: unknown) => {
        if (target === OrderEntity) {
          return orderRepo;
        }
        return instrumentRepo;
      }),
      query,
    } as unknown as DataSource;
    const repository = new PortfolioReadRepository(dataSource);

    const input = await repository.loadCalculationInput(5);

    expect(orderRepo.find).toHaveBeenCalledWith({
      where: { userId: 5 },
      order: { datetime: 'ASC', id: 'ASC' },
    });
    expect(input.latestCloses.get(1)).toBe(100);
    expect(input.orders).toEqual([]);
  });
});
