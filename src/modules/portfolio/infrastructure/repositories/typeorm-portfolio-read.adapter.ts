import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type {
  PortfolioCalculationInput,
  PortfolioInstrumentInput,
  PortfolioOrderInput,
} from '@/modules/portfolio/domain/entities/portfolio-input.types';
import type { PortfolioReadPort } from '@/modules/portfolio/application/ports/portfolio-read.port';

type OrderRow = {
  instrumentid: number;
  size: string | number;
  price: string | number;
  side: string;
  status: string;
  type: string;
};

type InstrumentRow = {
  id: number;
  ticker: string;
  name: string;
  type: string;
};

type CloseRow = {
  instrumentid: number;
  close: string | number;
};

function toNumber(value: string | number): number {
  return typeof value === 'number' ? value : Number(value);
}

function mapOrderRow(row: OrderRow): PortfolioOrderInput {
  return {
    instrumentId: row.instrumentid,
    size: toNumber(row.size),
    price: toNumber(row.price),
    side: row.side,
    status: row.status,
    type: row.type,
  };
}

function mapInstrumentRow(row: InstrumentRow): PortfolioInstrumentInput {
  return {
    id: row.id,
    ticker: row.ticker,
    name: row.name,
    type: row.type,
  };
}

@Injectable()
export class TypeOrmPortfolioReadAdapter implements PortfolioReadPort {
  constructor(private readonly dataSource: DataSource) {}

  async loadCalculationInput(
    userId: number,
  ): Promise<PortfolioCalculationInput> {
    const [orderRows, instrumentRows, closeRows]: [
      OrderRow[],
      InstrumentRow[],
      CloseRow[],
    ] = await Promise.all([
      this.dataSource.query(
        `SELECT instrumentid, size, price, side, status, type
       FROM orders
       WHERE userid = $1
       ORDER BY datetime ASC, id ASC`,
        [userId],
      ),
      this.dataSource.query(`SELECT id, ticker, name, type FROM instruments`),
      this.dataSource.query(
        `SELECT DISTINCT ON (instrumentid) instrumentid, close
       FROM marketdata
       ORDER BY instrumentid, date DESC`,
      ),
    ]);
    const latestCloses = new Map<number, number>();
    for (const row of closeRows) {
      latestCloses.set(row.instrumentid, toNumber(row.close));
    }
    return {
      orders: orderRows.map(mapOrderRow),
      instruments: instrumentRows.map(mapInstrumentRow),
      latestCloses,
    };
  }
}
