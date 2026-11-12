import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { numericMoneyTransformer } from '@/domain/money/numeric-money';
import { InstrumentEntity } from '@/modules/instruments/domain/entities/instrument.entity';
import { mapInstrumentEntityToPortfolioInput } from '@/modules/instruments/infrastructure/mappers/instrument-entity.mapper';
import { OrderEntity } from '@/modules/orders/domain/entities/order.entity';
import { mapOrderEntityToAvailabilityOrder } from '@/modules/orders/infrastructure/mappers/order-entity.mapper';
import type { PortfolioCalculationInput } from '@/modules/portfolio/domain/entities/portfolio-input.types';
import type { PortfolioReadPort } from '@/modules/portfolio/application/ports/portfolio-read.port';

type LatestCloseRow = {
  instrumentid: number;
  close: string | number;
};

function readClose(value: string | number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return numericMoneyTransformer.from(parsed);
}

@Injectable()
export class PortfolioReadRepository implements PortfolioReadPort {
  constructor(private readonly dataSource: DataSource) {}

  async loadCalculationInput(
    userId: number,
  ): Promise<PortfolioCalculationInput> {
    const [orders, instruments, closeRows]: [
      OrderEntity[],
      InstrumentEntity[],
      LatestCloseRow[],
    ] = await Promise.all([
      this.dataSource.getRepository(OrderEntity).find({
        where: { userId },
        order: { datetime: 'ASC', id: 'ASC' },
      }),
      this.dataSource.getRepository(InstrumentEntity).find(),
      this.dataSource.query(
        `SELECT DISTINCT ON (instrumentid) instrumentid, close
       FROM marketdata
       ORDER BY instrumentid, date DESC`,
      ),
    ]);

    const latestCloses = new Map<number, number>();
    for (const row of closeRows) {
      latestCloses.set(row.instrumentid, readClose(row.close));
    }

    return {
      orders: orders.map(mapOrderEntityToAvailabilityOrder),
      instruments: instruments.map(mapInstrumentEntityToPortfolioInput),
      latestCloses,
    };
  }
}
