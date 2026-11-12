import { Module } from '@nestjs/common';
import { TypeOrmInstrumentSearchAdapter } from '@/modules/instruments/infrastructure/repositories/typeorm-instrument-search.adapter';
import { InstrumentsController } from '@/modules/instruments/instruments.controller';
import { InstrumentsService } from '@/modules/instruments/application/services/instruments.service';
import { INSTRUMENT_SEARCH } from '@/modules/instruments/application/ports/instrument-search.port';

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
