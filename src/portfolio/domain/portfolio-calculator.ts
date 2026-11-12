import type {
  PortfolioResponse,
  PositionResponse,
} from '../portfolio-response.types.js';
import type {
  PortfolioCalculationInput,
  PortfolioOrderInput,
} from './portfolio-input.types.js';
import { roundMoney, roundPercentage } from './round-money.js';

type HoldingState = {
  quantity: number;
  averageCost: number;
};

function isCashMovement(order: PortfolioOrderInput): boolean {
  return order.side === 'CASH_IN' || order.side === 'CASH_OUT';
}

function tradeAmount(order: PortfolioOrderInput): number {
  return order.size * order.price;
}

function applyFilledCash(
  settledCash: number,
  order: PortfolioOrderInput,
): number {
  const amount = tradeAmount(order);
  if (order.side === 'CASH_IN' || order.side === 'SELL') {
    return settledCash + amount;
  }
  if (order.side === 'CASH_OUT' || order.side === 'BUY') {
    return settledCash - amount;
  }
  return settledCash;
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
  if (order.side === 'BUY') {
    const nextQuantity = existing.quantity + order.size;
    const nextCost =
      existing.averageCost * existing.quantity + order.price * order.size;
    holdings.set(order.instrumentId, {
      quantity: nextQuantity,
      averageCost: nextQuantity > 0 ? nextCost / nextQuantity : 0,
    });
    return;
  }
  if (order.side === 'SELL') {
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

function reservedCashFromNewLimits(orders: PortfolioOrderInput[]): number {
  let reserved = 0;
  for (const order of orders) {
    if (
      order.status === 'NEW' &&
      order.type === 'LIMIT' &&
      order.side === 'BUY'
    ) {
      reserved += tradeAmount(order);
    }
  }
  return reserved;
}

export function calculatePortfolio(
  input: PortfolioCalculationInput,
): PortfolioResponse {
  const instrumentById = new Map(
    input.instruments.map((instrument) => [instrument.id, instrument]),
  );
  const holdings = new Map<number, HoldingState>();
  let settledCash = 0;

  const sortedOrders = [...input.orders];
  for (const order of sortedOrders) {
    if (order.status !== 'FILLED') {
      continue;
    }
    const instrument = instrumentById.get(order.instrumentId);
    const isTradable = instrument !== undefined && instrument.type !== 'MONEDA';
    settledCash = applyFilledCash(settledCash, order);
    applyFilledHolding(holdings, order, isTradable);
  }

  const reservedCash = reservedCashFromNewLimits(input.orders);
  const cashBalance = roundMoney(settledCash - reservedCash);

  const positions: PositionResponse[] = [];
  let positionsMarketValue = 0;

  for (const instrument of input.instruments) {
    if (instrument.type === 'MONEDA') {
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
      currency: 'ARS',
    },
    positions,
  };
}
