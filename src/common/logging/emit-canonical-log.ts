import { Logger } from '@nestjs/common';
import type { CanonicalLogLevel } from './resolve-canonical-log-level.js';

export function emitCanonicalLog(
  logger: Logger,
  level: CanonicalLogLevel,
  payloadJson: string,
): void {
  switch (level) {
    case 'warn':
      logger.warn(payloadJson);
      return;
    case 'error':
      logger.error(payloadJson);
      return;
    default:
      logger.log(payloadJson);
  }
}
