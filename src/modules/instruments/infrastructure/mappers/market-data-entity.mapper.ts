import { DependencyException } from '@/common/errors/dependency.exception';
import type { MarketDataEntity } from '@/modules/instruments/domain/entities/market-data.entity';

export function readClosePrice(entity: MarketDataEntity): number {
  if (!Number.isFinite(entity.close)) {
    throw new DependencyException(entity.close);
  }
  return Math.round(entity.close * 100) / 100;
}
