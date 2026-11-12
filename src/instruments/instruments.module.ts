import { Module } from '@nestjs/common';
import { TypeOrmInstrumentSearchAdapter } from './adapters/typeorm-instrument-search.adapter.js';
import { InstrumentsController } from './instruments.controller.js';
import { InstrumentsService } from './instruments.service.js';
import { INSTRUMENT_SEARCH } from './ports/instrument-search.port.js';

@Module({
  controllers: [InstrumentsController],
  providers: [
    InstrumentsService,
    TypeOrmInstrumentSearchAdapter,
    {
      provide: INSTRUMENT_SEARCH,
      useExisting: TypeOrmInstrumentSearchAdapter,
    },
  ],
})
export class InstrumentsModule {}
