import { Injectable } from '@nestjs/common';
import { DataSource, QueryFailedError, type QueryRunner } from 'typeorm';
import { DependencyException } from '../../common/errors/dependency.exception.js';
import { UserNotFoundException } from '../../common/errors/user-not-found.exception.js';
import { IdempotencyConflictError } from '../domain/idempotency-conflict.error.js';
import { formatOrderDatetime } from '../domain/format-order-datetime.js';
import type {
  OrderSide,
  OrderStatus,
  OrderType,
} from '../domain/order.types.js';
import type { AvailabilityOrder } from '../domain/trading-availability.js';
import type { OrderResponse } from '../order-response.types.js';
import type {
  LockedOrderContext,
  NewIdempotencyRecord,
  NewOrderRecord,
  OrderTransactionPort,
  StoredIdempotency,
  TradableInstrument,
} from '../ports/order-transaction.port.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readRows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    throw new DependencyException(value);
  }
  return value.map((row) => {
    if (!isRecord(row)) {
      throw new DependencyException(row);
    }
    return row;
  });
}

function readNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  throw new DependencyException(value);
}

function readMoney(value: unknown): number {
  return Math.round(readNumber(value) * 100) / 100;
}

function readString(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new DependencyException(value);
  }
  return value;
}

function readOrderSide(value: unknown): OrderSide {
  if (value === 'BUY' || value === 'SELL') {
    return value;
  }
  throw new DependencyException(value);
}

function readOrderType(value: unknown): OrderType {
  if (value === 'MARKET' || value === 'LIMIT') {
    return value;
  }
  throw new DependencyException(value);
}

function readOrderStatus(value: unknown): OrderStatus {
  if (value === 'FILLED' || value === 'NEW' || value === 'REJECTED') {
    return value;
  }
  throw new DependencyException(value);
}

function readDatetime(value: unknown): string {
  if (!(value instanceof Date) && typeof value !== 'string') {
    throw new DependencyException(value);
  }
  const formatted = formatOrderDatetime(value);
  if (formatted === null) {
    throw new DependencyException(value);
  }
  return formatted;
}

function mapOrder(row: Record<string, unknown>): OrderResponse {
  return {
    order_id: readNumber(row.id),
    user_id: readNumber(row.userid),
    instrument_id: readNumber(row.instrumentid),
    side: readOrderSide(row.side),
    type: readOrderType(row.type),
    size: readNumber(row.size),
    price: readMoney(row.price),
    status: readOrderStatus(row.status),
    datetime: readDatetime(row.datetime),
  };
}

function mapAvailability(row: Record<string, unknown>): AvailabilityOrder {
  return {
    instrumentId: readNumber(row.instrumentid),
    size: readNumber(row.size),
    price: readMoney(row.price),
    side: readString(row.side),
    status: readString(row.status),
    type: readString(row.type),
  };
}

function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }
  const driverError: unknown = error.driverError;
  return (
    typeof driverError === 'object' &&
    driverError !== null &&
    'code' in driverError &&
    driverError.code === '23505'
  );
}

const FIND_IDEMPOTENCY = `SELECT k.payload_hash, o.id, o.instrumentid, o.userid, o.size, o.price, o.type, o.side, o.status, o.datetime
FROM order_idempotency_keys k
INNER JOIN orders o ON o.id = k.order_id
WHERE k.user_id = $1 AND k.idempotency_key = $2`;

@Injectable()
export class TypeOrmOrderTransactionAdapter implements OrderTransactionPort {
  constructor(private readonly dataSource: DataSource) {}

  async findIdempotency(
    userId: number,
    idempotencyKey: string,
  ): Promise<StoredIdempotency | null> {
    const rows = readRows(
      await this.dataSource.query(FIND_IDEMPOTENCY, [userId, idempotencyKey]),
    );
    return mapStoredIdempotency(rows);
  }

  async runInTransaction<T>(
    userId: number,
    work: (context: LockedOrderContext) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const locked = readRows(
        await queryRunner.query(
          'SELECT id FROM users WHERE id = $1 FOR UPDATE',
          [userId],
        ),
      );
      if (locked.length === 0) {
        throw new UserNotFoundException();
      }
      const result = await work(this.createContext(queryRunner));
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private createContext(queryRunner: QueryRunner): LockedOrderContext {
    return {
      findIdempotency: (userId, idempotencyKey) =>
        this.findIdempotencyOn(queryRunner, userId, idempotencyKey),
      loadInstrument: (instrumentId) =>
        this.loadInstrument(queryRunner, instrumentId),
      loadLatestClose: (instrumentId) =>
        this.loadLatestClose(queryRunner, instrumentId),
      loadOrders: (userId) => this.loadOrders(queryRunner, userId),
      insertOrder: (order) => this.insertOrder(queryRunner, order),
      insertIdempotency: (record) =>
        this.insertIdempotency(queryRunner, record),
    };
  }

  private async findIdempotencyOn(
    queryRunner: QueryRunner,
    userId: number,
    idempotencyKey: string,
  ): Promise<StoredIdempotency | null> {
    const rows = readRows(
      await queryRunner.query(FIND_IDEMPOTENCY, [userId, idempotencyKey]),
    );
    return mapStoredIdempotency(rows);
  }

  private async loadInstrument(
    queryRunner: QueryRunner,
    instrumentId: number,
  ): Promise<TradableInstrument | null> {
    const rows = readRows(
      await queryRunner.query(
        'SELECT id, type FROM instruments WHERE id = $1',
        [instrumentId],
      ),
    );
    const row = rows[0];
    if (row === undefined) {
      return null;
    }
    return {
      id: readNumber(row.id),
      type: readString(row.type),
    };
  }

  private async loadLatestClose(
    queryRunner: QueryRunner,
    instrumentId: number,
  ): Promise<number | null> {
    const rows = readRows(
      await queryRunner.query(
        `SELECT close
         FROM marketdata
         WHERE instrumentid = $1
         ORDER BY date DESC
         LIMIT 1`,
        [instrumentId],
      ),
    );
    const row = rows[0];
    if (row === undefined || row.close === null || row.close === undefined) {
      return null;
    }
    return readMoney(row.close);
  }

  private async loadOrders(
    queryRunner: QueryRunner,
    userId: number,
  ): Promise<AvailabilityOrder[]> {
    const rows = readRows(
      await queryRunner.query(
        `SELECT instrumentid, size, price, side, status, type
         FROM orders
         WHERE userid = $1
         ORDER BY datetime ASC, id ASC`,
        [userId],
      ),
    );
    return rows.map((row) => mapAvailability(row));
  }

  private async insertOrder(
    queryRunner: QueryRunner,
    order: NewOrderRecord,
  ): Promise<OrderResponse> {
    const rows = readRows(
      await queryRunner.query(
        `INSERT INTO orders (instrumentid, userid, size, price, type, side, status, datetime)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING id, instrumentid, userid, size, price, type, side, status, datetime`,
        [
          order.instrumentId,
          order.userId,
          order.size,
          order.price,
          order.type,
          order.side,
          order.status,
        ],
      ),
    );
    const row = rows[0];
    if (row === undefined) {
      throw new DependencyException(rows);
    }
    return mapOrder(row);
  }

  private async insertIdempotency(
    queryRunner: QueryRunner,
    record: NewIdempotencyRecord,
  ): Promise<void> {
    try {
      await queryRunner.query(
        `INSERT INTO order_idempotency_keys (user_id, idempotency_key, order_id, payload_hash)
         VALUES ($1, $2, $3, $4)`,
        [
          record.userId,
          record.idempotencyKey,
          record.orderId,
          record.payloadHash,
        ],
      );
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new IdempotencyConflictError();
      }
      throw error;
    }
  }
}

function mapStoredIdempotency(
  rows: readonly Record<string, unknown>[],
): StoredIdempotency | null {
  const row = rows[0];
  if (row === undefined) {
    return null;
  }
  return {
    payloadHash: readString(row.payload_hash),
    order: mapOrder(row),
  };
}
