import { ValidationException } from '@/common/errors/validation.exception';
import {
  searchInstrumentsQuerySchema,
  searchInstrumentsValidationPipe,
} from '@/instruments/search-instruments-query';

describe('searchInstrumentsQuerySchema', () => {
  it('defaults q to empty, limit to 10 and offset to 0', () => {
    expect(searchInstrumentsQuerySchema.parse({})).toEqual({
      q: '',
      limit: 10,
      offset: 0,
    });
  });

  it('trims the query and coerces pagination from strings', () => {
    expect(
      searchInstrumentsQuerySchema.parse({
        q: ' PAMP ',
        limit: '5',
        offset: '10',
      }),
    ).toEqual({
      q: 'PAMP',
      limit: 5,
      offset: 10,
    });
  });

  it.each([
    { limit: 'abc' },
    { limit: '0' },
    { limit: '-1' },
    { limit: '1.5' },
    { offset: '-1' },
    { offset: '1.5' },
    { offset: 'abc' },
  ])('rejects invalid pagination %o', (query) => {
    const result = searchInstrumentsQuerySchema.safeParse(query);
    expect(result.success).toBe(false);
  });
});

describe('searchInstrumentsValidationPipe', () => {
  it('throws ValidationException with the search message', async () => {
    await expect(
      searchInstrumentsValidationPipe.transform(
        { limit: 'abc' },
        {
          type: 'query',
          data: undefined,
          metatype: Object,
          schema: searchInstrumentsQuerySchema,
        },
      ),
    ).rejects.toMatchObject({
      name: ValidationException.name,
      message: 'Los parámetros de búsqueda son inválidos.',
    });
  });
});
