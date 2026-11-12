import {
  Injectable,
  type ArgumentMetadata,
  type PipeTransform,
} from '@nestjs/common';
import { z } from 'zod';
import { InvalidOrderSideException } from '@/common/errors/invalid-order-side.exception';
import { InvalidOrderTypeException } from '@/common/errors/invalid-order-type.exception';
import { ValidationException } from '@/common/errors/validation.exception';
import {
  ORDER_SIDES,
  ORDER_TYPES,
} from '@/modules/orders/domain/entities/order.types';

const MAX_MONEY = 99_999_999.99;
const MAX_SIZE = 2_147_483_647;

function hasAtMostTwoDecimalPlaces(value: number): boolean {
  const cents = Math.round(value * 100);
  return Math.abs(value - cents / 100) < 1e-8;
}

const moneySchema = z
  .number()
  .positive()
  .max(MAX_MONEY)
  .refine(hasAtMostTwoDecimalPlaces);

export const createOrderBodySchema = z
  .object({
    instrument_id: z.number().int().positive().max(MAX_SIZE),
    side: z.enum(ORDER_SIDES),
    type: z.enum(ORDER_TYPES),
    size: z.number().int().positive().max(MAX_SIZE).optional(),
    amount: moneySchema.optional(),
    price: moneySchema.optional(),
  })
  .strict()
  .superRefine((body, context) => {
    const hasSize = body.size !== undefined;
    const hasAmount = body.amount !== undefined;
    if (hasSize === hasAmount) {
      context.addIssue({ code: 'custom', message: 'quantity' });
    }
    if (body.type === 'MARKET' && body.price !== undefined) {
      context.addIssue({ code: 'custom', message: 'price' });
    }
    if (body.type === 'LIMIT' && body.price === undefined) {
      context.addIssue({ code: 'custom', message: 'price' });
    }
  });

export type CreateOrderBody = z.infer<typeof createOrderBodySchema>;

function readSubmittedString(
  raw: unknown,
  field: 'side' | 'type',
): string | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return undefined;
  }
  const value = (raw as Record<string, unknown>)[field];
  return typeof value === 'string' ? value : undefined;
}

function isSideOrTypeEnumIssue(
  issue: z.core.$ZodIssue,
): 'side' | 'type' | undefined {
  if (issue.code !== 'invalid_value' || issue.path.length !== 1) {
    return undefined;
  }
  const field = issue.path[0];
  if (field === 'side' || field === 'type') {
    return field;
  }
  return undefined;
}

export function resolveCreateOrderBodyException(
  issues: z.core.$ZodIssue[],
  raw: unknown,
): ValidationException | InvalidOrderSideException | InvalidOrderTypeException {
  for (const issue of issues) {
    const field = isSideOrTypeEnumIssue(issue);
    if (field === undefined) {
      continue;
    }
    if (readSubmittedString(raw, field) === undefined) {
      continue;
    }
    if (field === 'side') {
      return new InvalidOrderSideException();
    }
    return new InvalidOrderTypeException();
  }
  return new ValidationException();
}

@Injectable()
export class CreateOrderBodyValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): CreateOrderBody {
    void metadata;
    const result = createOrderBodySchema.safeParse(value);
    if (!result.success) {
      throw resolveCreateOrderBodyException(result.error.issues, value);
    }
    return result.data;
  }
}

export const createOrderValidationPipe = new CreateOrderBodyValidationPipe();
