import {
  CURRENCY_INSTRUMENT_TYPE,
  PORTFOLIO_CURRENCY,
} from '@/common/constants/app.constants';
import {
  filledCashDeltaCents,
  openBuyReserveCents,
} from '@/domain/ledger/cash-movement';
import type {
  PortfolioResponse,
  PositionResponse,
} from '@/modules/portfolio/application/dto/portfolio-response.types';
import type {
  PortfolioCalculationInput,
  PortfolioOrderInput,
} from '@/modules/portfolio/domain/entities/portfolio-input.types';
import { OrderSide, OrderStatus } from '@/domain/order-types';
import {
  roundMoney,
  roundPercentage,
} from '@/modules/portfolio/domain/round-money';
import { CASH_MOVEMENT_SIDES } from '@/modules/orders/domain/entities/order.types';
import type { OrderSide as OrderSideType } from '@/domain/order-types';

type HoldingState = {
  quantity: number;
  averageCost: number;
};

function isCashMovement(order: PortfolioOrderInput): boolean {
  return (CASH_MOVEMENT_SIDES as readonly OrderSideType[]).includes(order.side);
}

function applyFilledHolding(
  holdings: Map<number, HoldingState>,
  order: PortfolioOrderInput,
  isTradable: boolean,
): void {
  if (!isTradable || isCashMovement(order)) {
    return;
  }
  const existing = holdings.get(order.instrumentId) ?? {
    quantity: 0,
    averageCost: 0,
  };
  if (order.side === OrderSide.BUY) {
    const nextQuantity = existing.quantity + order.size;
    const nextCost =
      existing.averageCost * existing.quantity + order.price * order.size;
    holdings.set(order.instrumentId, {
      quantity: nextQuantity,
      averageCost: nextQuantity > 0 ? nextCost / nextQuantity : 0,
    });
    return;
  }
  if (order.side === OrderSide.SELL) {
    const nextQuantity = existing.quantity - order.size;
    if (nextQuantity > 0) {
      holdings.set(order.instrumentId, {
        quantity: nextQuantity,
        averageCost: existing.averageCost,
      });
    } else {
      holdings.set(order.instrumentId, {
        quantity: nextQuantity,
        averageCost: 0,
      });
    }
  }
}

export function calculatePortfolio(
  input: PortfolioCalculationInput,
): PortfolioResponse {
  const instrumentById = new Map(
    input.instruments.map((instrument) => [instrument.id, instrument]),
  );
  const holdings = new Map<number, HoldingState>();
  let settledCashCents = 0;

  const orders = input.orders;
  for (const order of orders) {
    if (order.status !== OrderStatus.FILLED) {
      continue;
    }
    const instrument = instrumentById.get(order.instrumentId);
    const isTradable =
      instrument !== undefined && instrument.type !== CURRENCY_INSTRUMENT_TYPE;
    settledCashCents += filledCashDeltaCents(order);
    applyFilledHolding(holdings, order, isTradable);
  }

  let reservedCashCents = 0;
  for (const order of input.orders) {
    reservedCashCents += openBuyReserveCents(order);
  }
  const settledCash = settledCashCents / 100;
  const cashBalance = roundMoney((settledCashCents - reservedCashCents) / 100);

  const positions: PositionResponse[] = [];
  let positionsMarketValue = 0;

  for (const instrument of input.instruments) {
    if (instrument.type === CURRENCY_INSTRUMENT_TYPE) {
      continue;
    }
    const holding = holdings.get(instrument.id);
    if (holding === undefined || holding.quantity <= 0) {
      continue;
    }
    const close = input.latestCloses.get(instrument.id);
    if (close === undefined) {
      continue;
    }
    const marketValue = roundMoney(holding.quantity * close);
    const costBasis = roundMoney(holding.averageCost * holding.quantity);
    const totalReturnPercentage =
      costBasis > 0
        ? roundPercentage(((marketValue - costBasis) / costBasis) * 100)
        : 0;
    positionsMarketValue += marketValue;
    positions.push({
      instrument_id: instrument.id,
      ticker: instrument.ticker,
      name: instrument.name,
      quantity: holding.quantity,
      market_value: marketValue,
      total_return_percentage: totalReturnPercentage,
    });
  }

  positions.sort((left, right) => left.ticker.localeCompare(right.ticker));

  const totalValue = roundMoney(settledCash + positionsMarketValue);

  return {
    summary: {
      total_value: totalValue,
      cash_balance: cashBalance,
      currency: PORTFOLIO_CURRENCY,
    },
    positions,
  };
}
