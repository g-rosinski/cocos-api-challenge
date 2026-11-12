import type { InstrumentItem } from '@/modules/instruments/application/dto/instruments-response.types';
import type { InstrumentEntity } from '@/modules/instruments/domain/entities/instrument.entity';
import type { PortfolioInstrumentInput } from '@/modules/portfolio/domain/entities/portfolio-input.types';

export function mapInstrumentEntityToSearchItem(
  entity: InstrumentEntity,
): InstrumentItem {
  return {
    instrument_id: entity.id,
    ticker: entity.ticker,
    name: entity.name,
    type: entity.type,
  };
}

export function mapInstrumentEntityToPortfolioInput(
  entity: InstrumentEntity,
): PortfolioInstrumentInput {
  return {
    id: entity.id,
    ticker: entity.ticker,
    name: entity.name,
    type: entity.type,
  };
}
