import { Test } from '@nestjs/testing';
import * as callContext from '../common/correlation/call-context.js';
import { callContextStorage } from '../common/correlation/call-context.js';
import { InternalException } from '../common/errors/internal.exception.js';
import { PortfolioController } from './portfolio.controller.js';
import type { PortfolioResponse } from './portfolio-response.types.js';
import { PortfolioService } from './portfolio.service.js';
import type { PortfolioService as PortfolioServiceType } from './portfolio.service.js';

describe('PortfolioController', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is wired through the Nest testing module', async () => {
    const module = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [
        {
          provide: PortfolioService,
          useValue: { getPortfolio: vi.fn() },
        },
      ],
    }).compile();

    expect(module.get(PortfolioController)).toBeInstanceOf(PortfolioController);
  });

  const samplePortfolio: PortfolioResponse = {
    summary: {
      total_value: 100,
      cash_balance: 100,
      currency: 'ARS',
    },
    positions: [
      {
        instrument_id: 47,
        ticker: 'PAMP',
        name: 'Pampa Holding S.A.',
        quantity: 1,
        market_value: 50,
        total_return_percentage: 0,
      },
    ],
  };

  it('throws InternalException when call context is missing', async () => {
    const portfolioService = {
      getPortfolio: vi.fn(),
    } as unknown as PortfolioServiceType;
    const controller = new PortfolioController(portfolioService);
    vi.spyOn(callContext, 'getCallContext').mockReturnValue(undefined);

    await expect(controller.getPortfolio()).rejects.toBeInstanceOf(
      InternalException,
    );
    expect(portfolioService.getPortfolio).not.toHaveBeenCalled();
  });

  it('throws InternalException when call context has no user id', async () => {
    const portfolioService = {
      getPortfolio: vi.fn(),
    } as unknown as PortfolioServiceType;
    const controller = new PortfolioController(portfolioService);

    await callContextStorage.run({ correlationId: 'corr-1' }, async () => {
      await expect(controller.getPortfolio()).rejects.toBeInstanceOf(
        InternalException,
      );
    });
    expect(portfolioService.getPortfolio).not.toHaveBeenCalled();
  });

  it('throws InternalException when user id is explicitly undefined on the store', async () => {
    const portfolioService = {
      getPortfolio: vi.fn(),
    } as unknown as PortfolioServiceType;
    const controller = new PortfolioController(portfolioService);
    vi.spyOn(callContext, 'getCallContext').mockReturnValue({
      correlationId: 'corr-explicit',
      userId: undefined,
    });

    await expect(controller.getPortfolio()).rejects.toBeInstanceOf(
      InternalException,
    );
    expect(portfolioService.getPortfolio).not.toHaveBeenCalled();
  });

  it('returns portfolio and sets canonical log attributes when positions exist', async () => {
    const portfolioService = {
      getPortfolio: vi.fn().mockResolvedValue(samplePortfolio),
    } as unknown as PortfolioServiceType;
    const controller = new PortfolioController(portfolioService);

    await callContextStorage.run(
      { correlationId: 'corr-2', userId: 1 },
      async () => {
        const response = await controller.getPortfolio();
        expect(response).toEqual(samplePortfolio);
        expect(portfolioService.getPortfolio).toHaveBeenCalledWith(1);
        const store = callContextStorage.getStore();
        expect(store?.title).toBe('GetPortfolio');
        expect(store?.attributes).toEqual({
          has_positions: true,
          position_count: 1,
        });
      },
    );
  });

  it('returns portfolio without enriching context when the store disappears', async () => {
    const portfolioService = {
      getPortfolio: vi.fn().mockResolvedValue(samplePortfolio),
    } as unknown as PortfolioServiceType;
    const controller = new PortfolioController(portfolioService);
    vi.spyOn(callContext, 'getCallContext')
      .mockReturnValueOnce({ correlationId: 'corr-4', userId: 1 })
      .mockReturnValueOnce(undefined);

    const response = await controller.getPortfolio();

    expect(response).toEqual(samplePortfolio);
    expect(portfolioService.getPortfolio).toHaveBeenCalledWith(1);
  });

  it('marks has_positions false when the portfolio has no positions', async () => {
    const emptyPortfolio: PortfolioResponse = {
      summary: {
        total_value: 0,
        cash_balance: 0,
        currency: 'ARS',
      },
      positions: [],
    };
    const portfolioService = {
      getPortfolio: vi.fn().mockResolvedValue(emptyPortfolio),
    } as unknown as PortfolioServiceType;
    const controller = new PortfolioController(portfolioService);

    await callContextStorage.run(
      { correlationId: 'corr-3', userId: 2 },
      async () => {
        await controller.getPortfolio();
        const store = callContextStorage.getStore();
        expect(store?.attributes).toEqual({
          has_positions: false,
          position_count: 0,
        });
      },
    );
  });
});
