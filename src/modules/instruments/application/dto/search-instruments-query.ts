import { StandardSchemaValidationPipe } from '@nestjs/common';
import { z } from 'zod';
import { INSTRUMENTS_DEFAULT_PAGE_SIZE } from '@/common/constants/app.constants';
import { ValidationException } from '@/common/errors/validation.exception';

export const searchInstrumentsQuerySchema = z.object({
  q: z.string().trim().optional().default(''),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .default(INSTRUMENTS_DEFAULT_PAGE_SIZE),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type SearchInstrumentsQuery = z.infer<
  typeof searchInstrumentsQuerySchema
>;

export const searchInstrumentsValidationPipe = new StandardSchemaValidationPipe(
  {
    exceptionFactory: () =>
      new ValidationException('Los parámetros de búsqueda son inválidos.'),
  },
);
