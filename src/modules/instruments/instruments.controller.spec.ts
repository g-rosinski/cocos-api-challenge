import { Test } from '@nestjs/testing';
import * as callContext from '@/common/correlation/call-context';
import { callContextStorage } from '@/common/correlation/call-context';
import type { InstrumentsResponse } from '@/modules/instruments/application/dto/instruments-response.types';
import { InstrumentsController } from '@/modules/instruments/instruments.controller';
import { InstrumentsService } from '@/modules/instruments/application/services/instruments.service';
import type { InstrumentsService as InstrumentsServiceType } from '@/modules/instruments/application/services/instruments.service';

describe('InstrumentsController', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const sampleResponse: InstrumentsResponse = {
    data: [
      {
        instrument_id: 47,
        ticker: 'PAMP',
        name: 'Pampa Holding S.A.',
        type: 'ACCIONES',
      },
    ],
    meta: { total: 1, limit: 10, offset: 0 },
  };

  it('is wired through the Nest testing module', async () => {
    const module = await Test.createTestingModule({
      controllers: [InstrumentsController],
      providers: [
        {
          provide: InstrumentsService,
          useValue: { search: vi.fn() },
        },
      ],
    }).compile();

    expect(module.get(InstrumentsController)).toBeInstanceOf(
      InstrumentsController,
    );
  });

  it('returns the search result and sets canonical log attributes', async () => {
    const instrumentsService = {
      search: vi.fn().mockResolvedValue(sampleResponse),
    } as unknown as InstrumentsServiceType;
    const controller = new InstrumentsController(instrumentsService);

    await callContextStorage.run({ correlationId: 'corr-1' }, async () => {
      const response = await controller.searchInstruments({
        q: 'pamp',
        limit: 10,
        offset: 0,
      });
      expect(response).toEqual(sampleResponse);
      expect(instrumentsService.search).toHaveBeenCalledWith({
        q: 'pamp',
        limit: 10,
        offset: 0,
      });
      const store = callContextStorage.getStore();
      expect(store?.title).toBe('SearchInstruments');
      expect(store?.attributes).toEqual({
        query: 'pamp',
        limit: 10,
        offset: 0,
        result_count: 1,
      });
      expect(store?.userId).toBeUndefined();
    });
  });

  it('returns the search result without enriching context when the store is missing', async () => {
    const instrumentsService = {
      search: vi.fn().mockResolvedValue(sampleResponse),
    } as unknown as InstrumentsServiceType;
    const controller = new InstrumentsController(instrumentsService);
    vi.spyOn(callContext, 'getCallContext').mockReturnValue(undefined);

    const response = await controller.searchInstruments({
      q: 'pamp',
      limit: 10,
      offset: 0,
    });

    expect(response).toEqual(sampleResponse);
    expect(instrumentsService.search).toHaveBeenCalledWith({
      q: 'pamp',
      limit: 10,
      offset: 0,
    });
  });

  it('sets result_count 0 for an empty page', async () => {
    const empty: InstrumentsResponse = {
      data: [],
      meta: { total: 0, limit: 10, offset: 0 },
    };
    const instrumentsService = {
      search: vi.fn().mockResolvedValue(empty),
    } as unknown as InstrumentsServiceType;
    const controller = new InstrumentsController(instrumentsService);

    await callContextStorage.run({ correlationId: 'corr-2' }, async () => {
      await controller.searchInstruments({ q: 'ARS', limit: 10, offset: 0 });
      expect(callContextStorage.getStore()?.attributes).toEqual({
        query: 'ARS',
        limit: 10,
        offset: 0,
        result_count: 0,
      });
    });
  });
});
