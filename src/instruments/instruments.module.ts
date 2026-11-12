import { Module } from '@nestjs/common';
import { TypeOrmInstrumentSearchAdapter } from '@/instruments/adapters/typeorm-instrument-search.adapter';
import { InstrumentsController } from '@/instruments/instruments.controller';
import { InstrumentsService } from '@/instruments/instruments.service';
import { INSTRUMENT_SEARCH } from '@/instruments/ports/instrument-search.port';

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
