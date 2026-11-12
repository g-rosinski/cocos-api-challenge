import { Inject, Injectable, Logger } from '@nestjs/common';
import { getCallContext } from '../common/correlation/call-context.js';
import { ApiClientException } from '../common/errors/api-client.exception.js';
import { IdempotencyKeyMismatchException } from '../common/errors/idempotency-key-mismatch.exception.js';
import { InstrumentNotFoundException } from '../common/errors/instrument-not-found.exception.js';
import { InstrumentNotTradableException } from '../common/errors/instrument-not-tradable.exception.js';
import { InternalException } from '../common/errors/internal.exception.js';
import type { CreateOrderBody } from './create-order-body.js';
import { canonicalOrderPayloadHash } from './domain/canonical-order-payload.js';
import { IdempotencyConflictError } from './domain/idempotency-conflict.error.js';
import { IllegalOrderTransitionError } from './domain/illegal-order-transition.error.js';
import { OrderStateMachine } from './domain/order-state-machine.js';
import { resolveOrderSize } from './domain/resolve-order-size.js';
import { calculateTradingAvailability } from './domain/trading-availability.js';
import type { OrderResponse } from './order-response.types.js';
import { OrderStrategyFactory } from './order-strategy.factory.js';
import {
  ORDER_TRANSACTION,
  type LockedOrderContext,
  type OrderTransactionPort,
  type StoredIdempotency,
} from './ports/order-transaction.port.js';

type ResolvedOrder = {
  order: OrderResponse;
  validationResult: string;
};

@Injectable()
export class CreateOrderService {
  private readonly logger = new Logger(CreateOrderService.name);

  constructor(
    @Inject(ORDER_TRANSACTION)
    private readonly orders: OrderTransactionPort,
    private readonly strategies: OrderStrategyFactory,
    private readonly stateMachine: OrderStateMachine,
  ) {}

  async create(
    userId: number,
    idempotencyKey: string,
    body: CreateOrderBody,
  ): Promise<OrderResponse> {
    const correlationId = getCallContext()?.correlationId ?? '';
    this.logReceived(correlationId, userId, body);
    const payloadHash = canonicalOrderPayloadHash(body);
    try {
      const resolved = await this.execute(
        userId,
        idempotencyKey,
        payloadHash,
        body,
      );
      this.logValidated(correlationId, resolved.validationResult);
      return resolved.order;
    } catch (error) {
      this.logFailure(correlationId, error);
      throw error;
    }
  }

  private async execute(
    userId: number,
    idempotencyKey: string,
    payloadHash: string,
    body: CreateOrderBody,
  ): Promise<ResolvedOrder> {
    const existing = await this.orders.findIdempotency(userId, idempotencyKey);
    if (existing !== null) {
      return this.matchExisting(existing, payloadHash);
    }
    try {
      return await this.orders.runInTransaction(userId, (context) =>
        this.placeOrReplay(context, userId, idempotencyKey, payloadHash, body),
      );
    } catch (error) {
      if (!(error instanceof IdempotencyConflictError)) {
        throw error;
      }
      const raced = await this.orders.findIdempotency(userId, idempotencyKey);
      if (raced === null) {
        throw new InternalException(error);
      }
      return this.matchExisting(raced, payloadHash);
    }
  }

  private async placeOrReplay(
    context: LockedOrderContext,
    userId: number,
    idempotencyKey: string,
    payloadHash: string,
    body: CreateOrderBody,
  ): Promise<ResolvedOrder> {
    const raced = await context.findIdempotency(userId, idempotencyKey);
    if (raced !== null) {
      return this.matchExisting(raced, payloadHash);
    }
    const instrument = await context.loadInstrument(body.instrument_id);
    if (instrument === null) {
      throw new InstrumentNotFoundException('El instrumento no existe.');
    }
    if (instrument.type === 'MONEDA') {
      throw new InstrumentNotTradableException(
        'El instrumento no es operable.',
      );
    }
    const latestClose =
      body.type === 'MARKET'
        ? await context.loadLatestClose(body.instrument_id)
        : null;
    const strategy = this.strategies.create(body.type);
    const price = strategy.resolvePrice({
      requestedPrice: body.price,
      latestClose: latestClose ?? undefined,
    });
    const size = resolveOrderSize({
      size: body.size,
      amount: body.amount,
      price,
    });
    const history = await context.loadOrders(userId);
    const availability = calculateTradingAvailability(
      history,
      body.instrument_id,
    );
    const status = this.stateMachine.decide({
      acceptedStatus: strategy.acceptedStatus,
      side: body.side,
      size,
      price,
      availableCash: availability.availableCash,
      availableShares: availability.availableShares,
    });
    const order = await context.insertOrder({
      userId,
      instrumentId: body.instrument_id,
      side: body.side,
      type: body.type,
      size,
      price,
      status,
    });
    await context.insertIdempotency({
      userId,
      idempotencyKey,
      orderId: order.order_id,
      payloadHash,
    });
    return { order, validationResult: status };
  }

  private matchExisting(
    existing: StoredIdempotency,
    payloadHash: string,
  ): ResolvedOrder {
    if (existing.payloadHash !== payloadHash) {
      throw new IdempotencyKeyMismatchException();
    }
    return { order: existing.order, validationResult: 'REPLAY' };
  }

  private logReceived(
    correlationId: string,
    userId: number,
    body: CreateOrderBody,
  ): void {
    const quantity =
      body.size !== undefined ? { size: body.size } : { amount: body.amount };
    this.logger.log(
      JSON.stringify({
        event: 'order_received',
        correlationId,
        userId,
        instrumentId: body.instrument_id,
        side: body.side,
        type: body.type,
        ...quantity,
      }),
    );
  }

  private logValidated(correlationId: string, result: string): void {
    this.logger.log(
      JSON.stringify({
        event: 'order_validated',
        correlationId,
        result,
      }),
    );
  }

  private logFailure(correlationId: string, error: unknown): void {
    if (error instanceof IdempotencyKeyMismatchException) {
      this.logger.warn(
        JSON.stringify({
          event: 'order_validated',
          correlationId,
          result: error.code,
        }),
      );
      return;
    }
    if (error instanceof ApiClientException) {
      this.logger.log(
        JSON.stringify({
          event: 'order_validated',
          correlationId,
          result: error.code,
        }),
      );
      return;
    }
    if (error instanceof IllegalOrderTransitionError) {
      this.logger.error(
        JSON.stringify({
          event: 'order_validated',
          correlationId,
          result: 'ILLEGAL_TRANSITION',
        }),
      );
    }
  }
}
