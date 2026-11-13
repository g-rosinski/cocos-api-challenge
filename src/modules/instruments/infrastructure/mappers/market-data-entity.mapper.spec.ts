import { DependencyException } from '@/common/errors/dependency.exception';
import type { MarketDataEntity } from '@/modules/instruments/domain/entities/market-data.entity';
import { readClosePrice } from '@/modules/instruments/infrastructure/mappers/market-data-entity.mapper';

function row(close: number): MarketDataEntity {
  return {
    id: 1,
    instrumentId: 47,
    close,
    date: '2026-11-10',
  };
}

describe('readClosePrice', () => {
  it('rounds the close to two decimals', () => {
    expect(readClosePrice(row(925.856))).toBe(925.86);
    expect(readClosePrice(row(100))).toBe(100);
  });

  it('rejects a non-finite close', () => {
    expect(() => readClosePrice(row(Number.NaN))).toThrow(DependencyException);
    expect(() => readClosePrice(row(Number.POSITIVE_INFINITY))).toThrow(
      DependencyException,
    );
  });
});
