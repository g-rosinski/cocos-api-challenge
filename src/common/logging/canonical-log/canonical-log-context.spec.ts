import { Logger } from '@nestjs/common';
import { callContextStorage } from '@/common/logging/call-context/call-context';
import { CanonicalLogContext } from '@/common/logging/canonical-log/canonical-log-context';

describe('CanonicalLogContext', () => {
  const service = new CanonicalLogContext();

  it('mutates the active call context', () => {
    callContextStorage.run({ correlationId: 'corr-1' }, () => {
      service.setTitle('SearchInstruments');
      service.setStatus('OK');
      service.mergeAttributes({ query: 'pamp', result_count: 1 });

      const store = callContextStorage.getStore();
      expect(store?.title).toBe('SearchInstruments');
      expect(store?.status).toBe('OK');
      expect(store?.attributes).toEqual({ query: 'pamp', result_count: 1 });
    });
  });

  it('ignores mutations when there is no active call context', () => {
    service.setTitle('Ignored');
    service.setStatus('IGNORED');
    service.mergeAttributes({ ignored: true });
    expect(callContextStorage.getStore()).toBeUndefined();
  });

  it('merges attributes into an existing bag', () => {
    callContextStorage.run(
      { correlationId: 'corr-3', attributes: { query: 'pamp' } },
      () => {
        service.mergeAttributes({ result_count: 2 });
        expect(callContextStorage.getStore()?.attributes).toEqual({
          query: 'pamp',
          result_count: 2,
        });
      },
    );
  });

  it('drops forbidden attributes and warns', () => {
    const warnSpy = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    callContextStorage.run({ correlationId: 'corr-2' }, () => {
      service.mergeAttributes({
        email: 'hidden@test.com',
        userId: 1,
      });
      expect(callContextStorage.getStore()?.attributes).toEqual({ userId: 1 });
    });

    warnSpy.mockRestore();
  });
});
