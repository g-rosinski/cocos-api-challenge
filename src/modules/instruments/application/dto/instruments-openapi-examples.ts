import { applyDecorators } from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  getSchemaPath,
  type SchemaObject,
} from '@nestjs/swagger';
import { databaseDownExample } from '@/openapi/error-response.schema';
import type { InstrumentsResponse } from '@/modules/instruments/application/dto/instruments-response.types';

const instrumentItemSchema: SchemaObject = {
  type: 'object',
  required: ['instrument_id', 'ticker', 'name', 'type'],
  properties: {
    instrument_id: { type: 'integer' },
    ticker: { type: 'string' },
    name: { type: 'string' },
    type: { type: 'string', example: 'ACCIONES' },
  },
};

export const instrumentsResponseSchema: SchemaObject = {
  type: 'object',
  required: ['data', 'meta'],
  properties: {
    data: { type: 'array', items: instrumentItemSchema },
    meta: {
      type: 'object',
      required: ['total', 'limit', 'offset'],
      properties: {
        total: { type: 'integer' },
        limit: { type: 'integer', example: 10 },
        offset: { type: 'integer', example: 0 },
      },
    },
  },
};

export const instrumentSearchByTickerExample: InstrumentsResponse = {
  data: [
    {
      instrument_id: 47,
      ticker: 'PAMP',
      name: 'Pampa Holding S.A.',
      type: 'ACCIONES',
    },
  ],
  meta: { total: 1, limit: 10, offset: 0 },
};

export const instrumentSearchByNameExample: InstrumentsResponse = {
  data: [
    {
      instrument_id: 47,
      ticker: 'PAMP',
      name: 'Pampa Holding S.A.',
      type: 'ACCIONES',
    },
  ],
  meta: { total: 1, limit: 10, offset: 0 },
};

export const instrumentFirstPageExample: InstrumentsResponse = {
  data: [
    {
      instrument_id: 26,
      ticker: 'AGRO',
      name: 'Agrometal',
      type: 'ACCIONES',
    },
    {
      instrument_id: 61,
      ticker: 'ALUA',
      name: 'Aluar Aluminio Argentino S.A.I.C.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 27,
      ticker: 'AUSO',
      name: 'Autopistas del Sol',
      type: 'ACCIONES',
    },
    {
      instrument_id: 22,
      ticker: 'BBAR',
      name: 'Banco Frances',
      type: 'ACCIONES',
    },
    {
      instrument_id: 28,
      ticker: 'BHIP',
      name: 'Banco Hipotecario S.A.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 31,
      ticker: 'BMA',
      name: 'Banco Macro S.A.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 29,
      ticker: 'BOLT',
      name: 'Boldt S.A.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 19,
      ticker: 'BPAT',
      name: 'Banco Patagonia',
      type: 'ACCIONES',
    },
    {
      instrument_id: 65,
      ticker: 'BYMA',
      name: 'Bolsas y Mercados Argentinos S.A.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 38,
      ticker: 'CADO',
      name: 'Carlos Casado',
      type: 'ACCIONES',
    },
  ],
  meta: { total: 65, limit: 10, offset: 0 },
};

export const instrumentEmptyCurrencyExample: InstrumentsResponse = {
  data: [],
  meta: { total: 0, limit: 10, offset: 0 },
};

export const instrumentSecondPageExample: InstrumentsResponse = {
  data: [
    { instrument_id: 2, ticker: 'CAPX', name: 'Capex S.A.', type: 'ACCIONES' },
    {
      instrument_id: 30,
      ticker: 'CARC',
      name: 'Carboclor S.A.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 25,
      ticker: 'CECO2',
      name: 'Central Costanera',
      type: 'ACCIONES',
    },
    {
      instrument_id: 24,
      ticker: 'CELU',
      name: 'Celulosa Argentina S.A.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 60,
      ticker: 'CEPU',
      name: 'Central Puerto',
      type: 'ACCIONES',
    },
    {
      instrument_id: 37,
      ticker: 'CGPA2',
      name: 'Camuzzi Gas del Sur',
      type: 'ACCIONES',
    },
    {
      instrument_id: 59,
      ticker: 'COME',
      name: 'Sociedad Comercial Del Plata',
      type: 'ACCIONES',
    },
    {
      instrument_id: 32,
      ticker: 'CRES',
      name: 'Cresud S.A.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 62,
      ticker: 'CTIO',
      name: 'Consultatio S.A.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 21,
      ticker: 'CVH',
      name: 'Cablevision Holding',
      type: 'ACCIONES',
    },
  ],
  meta: { total: 65, limit: 10, offset: 10 },
};

export const instrumentPageFiftyExample: InstrumentsResponse = {
  data: [
    { instrument_id: 26, ticker: 'AGRO', name: 'Agrometal', type: 'ACCIONES' },
    {
      instrument_id: 61,
      ticker: 'ALUA',
      name: 'Aluar Aluminio Argentino S.A.I.C.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 27,
      ticker: 'AUSO',
      name: 'Autopistas del Sol',
      type: 'ACCIONES',
    },
    {
      instrument_id: 22,
      ticker: 'BBAR',
      name: 'Banco Frances',
      type: 'ACCIONES',
    },
    {
      instrument_id: 28,
      ticker: 'BHIP',
      name: 'Banco Hipotecario S.A.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 31,
      ticker: 'BMA',
      name: 'Banco Macro S.A.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 29,
      ticker: 'BOLT',
      name: 'Boldt S.A.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 19,
      ticker: 'BPAT',
      name: 'Banco Patagonia',
      type: 'ACCIONES',
    },
    {
      instrument_id: 65,
      ticker: 'BYMA',
      name: 'Bolsas y Mercados Argentinos S.A.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 38,
      ticker: 'CADO',
      name: 'Carlos Casado',
      type: 'ACCIONES',
    },
    { instrument_id: 2, ticker: 'CAPX', name: 'Capex S.A.', type: 'ACCIONES' },
    {
      instrument_id: 30,
      ticker: 'CARC',
      name: 'Carboclor S.A.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 25,
      ticker: 'CECO2',
      name: 'Central Costanera',
      type: 'ACCIONES',
    },
    {
      instrument_id: 24,
      ticker: 'CELU',
      name: 'Celulosa Argentina S.A.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 60,
      ticker: 'CEPU',
      name: 'Central Puerto',
      type: 'ACCIONES',
    },
    {
      instrument_id: 37,
      ticker: 'CGPA2',
      name: 'Camuzzi Gas del Sur',
      type: 'ACCIONES',
    },
    {
      instrument_id: 59,
      ticker: 'COME',
      name: 'Sociedad Comercial Del Plata',
      type: 'ACCIONES',
    },
    {
      instrument_id: 32,
      ticker: 'CRES',
      name: 'Cresud S.A.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 62,
      ticker: 'CTIO',
      name: 'Consultatio S.A.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 21,
      ticker: 'CVH',
      name: 'Cablevision Holding',
      type: 'ACCIONES',
    },
    {
      instrument_id: 35,
      ticker: 'DGCU2',
      name: 'Distribuidora De Gas Cuyano S.A.',
      type: 'ACCIONES',
    },
    { instrument_id: 12, ticker: 'DOME', name: 'Domec', type: 'ACCIONES' },
    { instrument_id: 1, ticker: 'DYCA', name: 'Dycasa S.A.', type: 'ACCIONES' },
    { instrument_id: 33, ticker: 'EDN', name: 'Edenor S.A.', type: 'ACCIONES' },
    { instrument_id: 8, ticker: 'FERR', name: 'Ferrum S.A.', type: 'ACCIONES' },
    { instrument_id: 15, ticker: 'FIPL', name: 'Fiplasto', type: 'ACCIONES' },
    {
      instrument_id: 11,
      ticker: 'GAMI',
      name: 'Boldt Gaming S.A.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 16,
      ticker: 'GARO',
      name: 'Garovaglio Y Zorraquín',
      type: 'ACCIONES',
    },
    {
      instrument_id: 36,
      ticker: 'GBAN',
      name: 'Gas Natural Ban S.A.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 39,
      ticker: 'GCLA',
      name: 'Grupo Clarin S.A.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 34,
      ticker: 'GGAL',
      name: 'Grupo Financiero Galicia',
      type: 'ACCIONES',
    },
    { instrument_id: 40, ticker: 'GRIM', name: 'Grimoldi', type: 'ACCIONES' },
    {
      instrument_id: 18,
      ticker: 'HARG',
      name: 'Holcim (Argentina) S.A.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 64,
      ticker: 'HAVA',
      name: 'Havanna Holding',
      type: 'ACCIONES',
    },
    {
      instrument_id: 13,
      ticker: 'INTR',
      name: 'Compañía Introductora de Buenos Aires S.A.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 52,
      ticker: 'INVJ',
      name: 'Inversora Juramento S.A.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 10,
      ticker: 'IRCP',
      name: 'IRSA Propiedades Comerciales S.A.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 46,
      ticker: 'IRSA',
      name: 'IRSA Inversiones y Representaciones S.A.',
      type: 'ACCIONES',
    },
    { instrument_id: 23, ticker: 'LEDE', name: 'Ledesma', type: 'ACCIONES' },
    {
      instrument_id: 45,
      ticker: 'LOMA',
      name: 'Loma Negra S.A.',
      type: 'ACCIONES',
    },
    { instrument_id: 55, ticker: 'LONG', name: 'Longvie', type: 'ACCIONES' },
    {
      instrument_id: 54,
      ticker: 'METR',
      name: 'MetroGAS S.A.',
      type: 'ACCIONES',
    },
    { instrument_id: 5, ticker: 'MIRG', name: 'Mirgor', type: 'ACCIONES' },
    {
      instrument_id: 4,
      ticker: 'MOLA',
      name: 'Molinos Agro S.A.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 42,
      ticker: 'MOLI',
      name: 'Molinos Río de la Plata',
      type: 'ACCIONES',
    },
    {
      instrument_id: 51,
      ticker: 'MORI',
      name: 'Morixe Hermanos S.A.C.I.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 14,
      ticker: 'MTR',
      name: 'Matba Rofex S.A.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 58,
      ticker: 'OEST',
      name: 'Oeste Grupo Concesionario',
      type: 'ACCIONES',
    },
    {
      instrument_id: 47,
      ticker: 'PAMP',
      name: 'Pampa Holding S.A.',
      type: 'ACCIONES',
    },
    {
      instrument_id: 6,
      ticker: 'PATA',
      name: 'Importadora y Exportadora de la Patagonia',
      type: 'ACCIONES',
    },
  ],
  meta: { total: 65, limit: 50, offset: 0 },
};

const errorSchema = { $ref: getSchemaPath('ErrorResponse') };

export function ApiSearchInstruments(): MethodDecorator {
  return applyDecorators(
    ApiTags('Instrumentos'),
    ApiOperation({
      summary: 'Buscar un activo',
      description:
        'Busca por ticker o por nombre, sin distinguir mayúsculas. La moneda no aparece. Sin q, la primera página trae 10 activos ordenados por ticker.',
    }),
    ApiQuery({
      name: 'q',
      required: false,
      description:
        'Parte del ticker o del nombre. Vacío devuelve el catálogo paginado, sin la moneda.',
      example: 'pamp',
      examples: {
        searchByTicker: {
          summary: 'q: pamp',
          description:
            'Parte del ticker. Respuesta de ejemplo: escenario searchByTicker.',
          value: 'pamp',
        },
        searchByName: {
          summary: 'q: Pampa',
          description:
            'Parte del nombre. Respuesta de ejemplo: escenario searchByName.',
          value: 'Pampa',
        },
        catalogFirstPage: {
          summary: 'q omitido',
          description:
            'Sin filtro de texto. Respuesta de ejemplo: escenario catalogFirstPage.',
          value: '',
        },
        currencyByName: {
          summary: 'q: pesos',
          description:
            'Solo coincide con moneda. Respuesta: escenario currencyByName.',
          value: 'pesos',
        },
        currencyByTicker: {
          summary: 'q: ARS',
          description:
            'Ticker de moneda excluido. Respuesta: escenario currencyByTicker.',
          value: 'ARS',
        },
      },
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: 'Tamaño de página. Por defecto 10.',
      example: 10,
      examples: {
        defaultPage: {
          summary: 'limit: 10',
          description:
            'Valor por defecto. Combinar con escenarios que usan paginación estándar.',
          value: 10,
        },
        pageSizeFifty: {
          summary: 'limit: 50',
          description:
            'Página grande sin q. Respuesta de ejemplo: escenario pageSizeFifty.',
          value: 50,
        },
      },
    }),
    ApiQuery({
      name: 'offset',
      required: false,
      description: 'Cantidad de activos que se saltean. Por defecto 0.',
      example: 0,
      examples: {
        catalogFirstPage: {
          summary: 'offset: 0',
          description:
            'Inicio del listado. Respuesta: escenario catalogFirstPage o pageSizeFifty.',
          value: 0,
        },
        secondPage: {
          summary: 'offset: 10',
          description:
            'Segunda página con limit 10. Respuesta de ejemplo: escenario secondPage.',
          value: 10,
        },
      },
    }),
    ApiOkResponse({
      description:
        'Página de activos y el total que cumple el filtro. Cada ejemplo es un escenario E2E del RFC §12; el query completo está en la descripción.',
      schema: { $ref: getSchemaPath('InstrumentsResponse') },
      examples: {
        searchByTicker: {
          summary: 'Buscar por ticker existente',
          value: instrumentSearchByTickerExample,
        },
        searchByName: {
          summary: 'Buscar por nombre existente',
          value: instrumentSearchByNameExample,
        },
        catalogFirstPage: {
          summary: 'Listar catálogo sin búsqueda',
          value: instrumentFirstPageExample,
        },
        pageSizeFifty: {
          summary: 'Listar con página de 50',
          value: instrumentPageFiftyExample,
        },
        currencyByName: {
          summary: 'Texto que solo coincide con moneda',
          value: instrumentEmptyCurrencyExample,
        },
        currencyByTicker: {
          summary: 'Ticker ARS excluido del catálogo',
          value: instrumentEmptyCurrencyExample,
        },
        secondPage: {
          summary: 'Segunda página del catálogo',
          value: instrumentSecondPageExample,
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description:
        'La base no responde. El cuerpo no describe la falla. Este caso no se ejecuta contra el seed.',
      schema: errorSchema,
      examples: { databaseDown: databaseDownExample },
    }),
  );
}
