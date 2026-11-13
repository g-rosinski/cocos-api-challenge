import { Injectable } from '@nestjs/common';
import { DataSource, QueryFailedError, type QueryRunner } from 'typeorm';
import { UserNotFoundException } from '@/common/errors/user-not-found.exception';
import { IdempotencyConflictError } from '@/modules/orders/domain/idempotency-conflict.error';
import { InstrumentEntity } from '@/modules/instruments/domain/entities/instrument.entity';
import { MarketDataEntity } from '@/modules/instruments/domain/entities/market-data.entity';
import { readClosePrice } from '@/modules/instruments/infrastructure/mappers/market-data-entity.mapper';
import { OrderEntity } from '@/modules/orders/domain/entities/order.entity';
import { OrderIdempotencyKeyEntity } from '@/modules/orders/domain/entities/order-idempotency-key.entity';
import { UserEntity } from '@/modules/users/domain/entities/user.entity';
import {
  mapOrderEntityToAvailabilityOrder,
  mapOrderEntityToOrderResponse,
} from '@/modules/orders/infrastructure/mappers/order-entity.mapper';
import type { AvailabilityOrder } from '@/modules/orders/domain/validators/trading-availability';
import type { OrderResponse } from '@/modules/orders/application/dto/order-response.types';
import type {
  LockedOrderContext,
  NewIdempotencyRecord,
  NewOrderRecord,
  OrderTransactionPort,
  StoredIdempotency,
  TradableInstrument,
} from '@/modules/orders/application/ports/order-transaction.port';

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

@Injectable()
export class OrderTransactionRepository implements OrderTransactionPort {
  constructor(private readonly dataSource: DataSource) {}

  async findIdempotency(
    userId: number,
    idempotencyKey: string,
  ): Promise<StoredIdempotency | null> {
    return this.findIdempotencyWithManager(
      this.dataSource.manager,
      userId,
      idempotencyKey,
    );
  }

  async runInTransaction<T>(
    userId: number,
    work: (context: LockedOrderContext) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const locked = await queryRunner.manager.findOne(UserEntity, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (locked === null) {
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
        this.findIdempotencyWithManager(
          queryRunner.manager,
          userId,
          idempotencyKey,
        ),
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

  private async findIdempotencyWithManager(
    manager: DataSource['manager'],
    userId: number,
    idempotencyKey: string,
  ): Promise<StoredIdempotency | null> {
    const record = await manager.findOne(OrderIdempotencyKeyEntity, {
      where: { userId, idempotencyKey },
      relations: { order: true },
    });
    if (record === null || record.order === undefined) {
      return null;
    }
    return {
      payloadHash: record.payloadHash,
      order: mapOrderEntityToOrderResponse(record.order),
    };
  }

  private async loadInstrument(
    queryRunner: QueryRunner,
    instrumentId: number,
  ): Promise<TradableInstrument | null> {
    const instrument = await queryRunner.manager.findOne(InstrumentEntity, {
      where: { id: instrumentId },
    });
    if (instrument === null) {
      return null;
    }
    return { id: instrument.id, type: instrument.type };
  }

  private async loadLatestClose(
    queryRunner: QueryRunner,
    instrumentId: number,
  ): Promise<number | null> {
    const row = await queryRunner.manager.findOne(MarketDataEntity, {
      where: { instrumentId },
      order: { date: 'DESC' },
    });
    if (row === null) {
      return null;
    }
    return readClosePrice(row);
  }

  private async loadOrders(
    queryRunner: QueryRunner,
    userId: number,
  ): Promise<AvailabilityOrder[]> {
    const orders = await queryRunner.manager.find(OrderEntity, {
      where: { userId },
      order: { datetime: 'ASC', id: 'ASC' },
    });
    return orders.map(mapOrderEntityToAvailabilityOrder);
  }

  private async insertOrder(
    queryRunner: QueryRunner,
    order: NewOrderRecord,
  ): Promise<OrderResponse> {
    const entity = queryRunner.manager.create(OrderEntity, {
      instrumentId: order.instrumentId,
      userId: order.userId,
      size: order.size,
      price: order.price,
      type: order.type,
      side: order.side,
      status: order.status,
      datetime: new Date(),
    });
    const saved = await queryRunner.manager.save(entity);
    return mapOrderEntityToOrderResponse(saved);
  }

  private async insertIdempotency(
    queryRunner: QueryRunner,
    record: NewIdempotencyRecord,
  ): Promise<void> {
    const entity = queryRunner.manager.create(OrderIdempotencyKeyEntity, {
      userId: record.userId,
      idempotencyKey: record.idempotencyKey,
      orderId: record.orderId,
      payloadHash: record.payloadHash,
    });
    try {
      await queryRunner.manager.save(entity);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new IdempotencyConflictError();
      }
      throw error;
    }
  }
}
