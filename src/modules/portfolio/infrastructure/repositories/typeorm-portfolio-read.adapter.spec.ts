import { DataSource } from 'typeorm';
import { OrderSide, OrderStatus, OrderType } from '@/domain/order-types';
import { TypeOrmPortfolioReadAdapter } from '@/modules/portfolio/infrastructure/repositories/typeorm-portfolio-read.adapter';

describe('TypeOrmPortfolioReadAdapter', () => {
  it('maps database rows into portfolio calculation input', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce([
        {
          instrumentid: 47,
          size: '10',
          price: '930.50',
          side: OrderSide.BUY,
          status: OrderStatus.FILLED,
          type: OrderType.MARKET,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 47,
          ticker: 'PAMP',
          name: 'Pampa Holding S.A.',
          type: 'ACCIONES',
        },
        {
          id: 66,
          ticker: 'ARS',
          name: 'PESOS',
          type: 'MONEDA',
        },
      ])
      .mockResolvedValueOnce([
        { instrumentid: 47, close: 925.85 },
        { instrumentid: 66, close: 1 },
      ]);
    const dataSource = { query } as unknown as DataSource;
    const adapter = new TypeOrmPortfolioReadAdapter(dataSource);

    const input = await adapter.loadCalculationInput(1);

    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('FROM orders'),
      [1],
    );
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
    const query = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ instrumentid: 1, close: 100 }]);
    const dataSource = { query } as unknown as DataSource;
    const adapter = new TypeOrmPortfolioReadAdapter(dataSource);

    const input = await adapter.loadCalculationInput(5);

    expect(query).toHaveBeenNthCalledWith(1, expect.any(String), [5]);
    expect(input.latestCloses.get(1)).toBe(100);
    expect(input.orders).toEqual([]);
  });
});
