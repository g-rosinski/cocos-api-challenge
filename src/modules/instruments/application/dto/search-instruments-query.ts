import { StandardSchemaValidationPipe } from '@nestjs/common';
import { z } from 'zod';
import { ValidationException } from '@/common/errors/validation.exception';

export const searchInstrumentsQuerySchema = z.object({
  q: z.string().trim().optional().default(''),
  limit: z.coerce.number().int().positive().optional().default(10),
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
