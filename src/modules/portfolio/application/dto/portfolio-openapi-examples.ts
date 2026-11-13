import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiHeader,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
  type SchemaObject,
} from '@nestjs/swagger';
import {
  databaseDownExample,
  invalidUserIdExample,
  missingUserIdExample,
  unknownAccountExample,
} from '@/openapi/error-response.schema';
import type { PortfolioResponse } from '@/modules/portfolio/application/dto/portfolio-response.types';

export const portfolioResponseSchema: SchemaObject = {
  type: 'object',
  required: ['summary', 'positions'],
  properties: {
    summary: {
      type: 'object',
      required: ['total_value', 'cash_balance', 'currency'],
      properties: {
        total_value: { type: 'number', example: 904784 },
        cash_balance: { type: 'number', example: 627500 },
        currency: { type: 'string', enum: ['ARS'], example: 'ARS' },
      },
    },
    positions: {
      type: 'array',
      items: {
        type: 'object',
        required: [
          'instrument_id',
          'ticker',
          'name',
          'quantity',
          'market_value',
          'total_return_percentage',
        ],
        properties: {
          instrument_id: { type: 'integer' },
          ticker: { type: 'string' },
          name: { type: 'string' },
          quantity: { type: 'integer' },
          market_value: { type: 'number' },
          total_return_percentage: { type: 'number' },
        },
      },
    },
  },
};

export const portfolioValidAccountExample: PortfolioResponse = {
  summary: {
    total_value: 904784,
    cash_balance: 627500,
    currency: 'ARS',
  },
  positions: [
    {
      instrument_id: 54,
      ticker: 'METR',
      name: 'MetroGAS S.A.',
      quantity: 500,
      market_value: 114750,
      total_return_percentage: -8.2,
    },
    {
      instrument_id: 47,
      ticker: 'PAMP',
      name: 'Pampa Holding S.A.',
      quantity: 40,
      market_value: 37034,
      total_return_percentage: -0.45,
    },
  ],
};

export const portfolioEmptyAccountExample: PortfolioResponse = {
  summary: {
    total_value: 0,
    cash_balance: 0,
    currency: 'ARS',
  },
  positions: [],
};

const errorSchema = { $ref: getSchemaPath('ErrorResponse') };

export function ApiGetPortfolio(): MethodDecorator {
  return applyDecorators(
    ApiTags('Cuenta'),
    ApiOperation({
      summary: 'Ver la cuenta',
      description:
        'Devuelve el valor total, los pesos disponibles y las posiciones de la cuenta indicada en x-user-id. Banco Macro no aparece. La cuenta 1 tiene movimientos; la 2 no tiene órdenes en el seed.',
    }),
    ApiHeader({
      name: 'x-user-id',
      description:
        'Cuenta a consultar. Entero existente en users. Si falta, no es un entero o es inválido, la respuesta es 400.',
      required: true,
      schema: { type: 'integer' },
      example: 1,
      examples: {
        validAccount: {
          summary: 'Portfolio de cuenta con movimientos',
          value: 1,
        },
        emptyAccount: {
          summary: 'Portfolio de cuenta sin movimientos',
          value: 2,
        },
        unknownAccount: {
          summary: 'Consultar cuenta inexistente',
          value: 999,
        },
        invalidUserId: {
          summary: 'Consultar con identificador inválido',
          value: 'ABC',
        },
      },
    }),
    ApiOkResponse({
      description:
        'Cuenta calculada a partir de las órdenes y el último cierre.',
      schema: { $ref: getSchemaPath('PortfolioResponse') },
      examples: {
        validAccount: {
          summary: 'Portfolio de cuenta con movimientos',
          value: portfolioValidAccountExample,
        },
        emptyAccount: {
          summary: 'Portfolio de cuenta sin movimientos',
          value: portfolioEmptyAccountExample,
        },
      },
    }),
    ApiBadRequestResponse({
      description:
        'El header x-user-id falta, no es un entero o es inválido (p. ej. ABC).',
      schema: errorSchema,
      examples: {
        missingUserId: missingUserIdExample,
        invalidUserId: invalidUserIdExample,
      },
    }),
    ApiNotFoundResponse({
      description: 'La cuenta no existe.',
      schema: errorSchema,
      examples: { unknownAccount: unknownAccountExample },
    }),
    ApiInternalServerErrorResponse({
      description:
        'La base no responde. El cuerpo no describe la falla. Este caso no se ejecuta contra el seed.',
      schema: errorSchema,
      examples: { databaseDown: databaseDownExample },
    }),
  );
}
