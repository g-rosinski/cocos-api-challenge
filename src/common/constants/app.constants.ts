export const CURRENCY_INSTRUMENT_TYPE = 'MONEDA' as const;
export const PORTFOLIO_CURRENCY = 'ARS' as const;

/**
 * Cantidad máxima de unidades en una orden (field: size).
 * Limitado por el tipo de columna: orders.size es INT en PostgreSQL (INT4, 2^31 - 1 = 2.147.483.647).
 * Insertar un valor mayor causaría "integer out of range" en el driver.
 */
export const ORDER_MAX_SIZE = 2_147_483_647;

/**
 * Tope de sanidad para montos y precios en una orden.
 * No configurable por entorno: cambiar este valor implicaría
 * versionar el contrato de validación de la API.
 */
export const ORDER_MAX_AMOUNT_ARS = 99_999_999.99;

/**
 * Tamaño de página por defecto para la búsqueda de instrumentos.
 * Fijado por el RFC (sección 1, requerimiento 8): "la página trae como máximo 10 activos".
 */
export const INSTRUMENTS_DEFAULT_PAGE_SIZE = 10;
