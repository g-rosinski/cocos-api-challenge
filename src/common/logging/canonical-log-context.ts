import { Injectable, Logger } from '@nestjs/common';
import { getCallContext } from '@/common/correlation/call-context';
import type { CanonicalLogAttributes } from '@/common/logging/canonical-log-attribute';

const FORBIDDEN_ATTRIBUTE_KEYS = new Set(['email', 'accountNumber']);

@Injectable()
export class CanonicalLogContext {
  private readonly logger = new Logger(CanonicalLogContext.name);

  setTitle(title: string): void {
    const context = getCallContext();
    if (context === undefined) {
      return;
    }
    context.title = title;
  }

  setStatus(status: string): void {
    const context = getCallContext();
    if (context === undefined) {
      return;
    }
    context.status = status;
  }

  mergeAttributes(attributes: CanonicalLogAttributes): void {
    const context = getCallContext();
    if (context === undefined) {
      return;
    }
    const safeAttributes = this.filterForbiddenAttributes(attributes);
    if (context.attributes === undefined) {
      context.attributes = { ...safeAttributes };
      return;
    }
    Object.assign(context.attributes, safeAttributes);
  }

  private filterForbiddenAttributes(
    attributes: CanonicalLogAttributes,
  ): CanonicalLogAttributes {
    const safe: CanonicalLogAttributes = {};
    for (const [key, value] of Object.entries(attributes)) {
      if (FORBIDDEN_ATTRIBUTE_KEYS.has(key)) {
        this.logger.warn(`Canonical log attribute "${key}" is not allowed`);
        continue;
      }
      safe[key] = value;
    }
    return safe;
  }
}
