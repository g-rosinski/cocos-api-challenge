import { StandardSchemaValidationPipe } from '@nestjs/common';
import { z } from 'zod';
import { ValidationException } from '../common/errors/validation.exception.js';

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
    side: z.enum(['BUY', 'SELL']),
    type: z.enum(['MARKET', 'LIMIT']),
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

export const createOrderValidationPipe = new StandardSchemaValidationPipe({
  exceptionFactory: () => new ValidationException(),
});
