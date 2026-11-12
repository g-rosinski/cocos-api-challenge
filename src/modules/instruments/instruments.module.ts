import { Module } from '@nestjs/common';
import { InstrumentSearchRepository } from '@/modules/instruments/infrastructure/repositories/instrument-search.repository';
import { InstrumentsController } from '@/modules/instruments/instruments.controller';
import { InstrumentsService } from '@/modules/instruments/application/services/instruments.service';
import { INSTRUMENT_SEARCH } from '@/modules/instruments/application/ports/instrument-search.port';

@Module({
  controllers: [InstrumentsController],
  providers: [
    InstrumentsService,
    InstrumentSearchRepository,
    {
      provide: INSTRUMENT_SEARCH,
      useExisting: InstrumentSearchRepository,
    },
  ],
})
export class InstrumentsModule {}
