import type { InstrumentEntity } from '@/modules/instruments/domain/entities/instrument.entity';
import {
  mapInstrumentEntityToPortfolioInput,
  mapInstrumentEntityToSearchItem,
} from '@/modules/instruments/infrastructure/mappers/instrument-entity.mapper';

const sample: InstrumentEntity = {
  id: 47,
  ticker: 'PAMP',
  name: 'Pampa Holding S.A.',
  type: 'ACCIONES',
};

describe('instrument-entity.mapper', () => {
  it('maps an entity to a search item', () => {
    expect(mapInstrumentEntityToSearchItem(sample)).toEqual({
      instrument_id: 47,
      ticker: 'PAMP',
      name: 'Pampa Holding S.A.',
      type: 'ACCIONES',
    });
  });

  it('maps an entity to portfolio calculation input', () => {
    expect(mapInstrumentEntityToPortfolioInput(sample)).toEqual({
      id: 47,
      ticker: 'PAMP',
      name: 'Pampa Holding S.A.',
      type: 'ACCIONES',
    });
  });
});
