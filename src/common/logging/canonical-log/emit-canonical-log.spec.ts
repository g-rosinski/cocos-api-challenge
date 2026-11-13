import { Logger } from '@nestjs/common';
import { emitCanonicalLog } from '@/common/logging/canonical-log/emit-canonical-log';

describe('emitCanonicalLog', () => {
  const logger = new Logger('test');

  it('uses the matching logger method per level', () => {
    const logSpy = vi.spyOn(logger, 'log').mockImplementation(() => undefined);
    const warnSpy = vi
      .spyOn(logger, 'warn')
      .mockImplementation(() => undefined);
    const errorSpy = vi
      .spyOn(logger, 'error')
      .mockImplementation(() => undefined);

    emitCanonicalLog(logger, 'info', '{"message":"ok"}');
    emitCanonicalLog(logger, 'warn', '{"message":"slow"}');
    emitCanonicalLog(logger, 'error', '{"message":"fail"}');

    expect(logSpy).toHaveBeenCalledOnce();
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(errorSpy).toHaveBeenCalledOnce();

    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
