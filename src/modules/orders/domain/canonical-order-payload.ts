import { createHash } from 'node:crypto';

export type CanonicalOrderPayloadInput = {
  instrument_id: number;
  side: string;
  type: string;
  size?: number;
  amount?: number;
  price?: number;
};

const CANONICAL_KEYS = [
  'amount',
  'instrument_id',
  'price',
  'side',
  'size',
  'type',
] as const;

export function canonicalOrderPayload(
  body: CanonicalOrderPayloadInput,
): string {
  const values: Record<string, string | number> = {
    instrument_id: body.instrument_id,
    side: body.side,
    type: body.type,
  };
  if (body.amount !== undefined) {
    values.amount = body.amount;
  }
  if (body.price !== undefined) {
    values.price = body.price;
  }
  if (body.size !== undefined) {
    values.size = body.size;
  }
  const ordered: Record<string, string | number> = {};
  for (const key of CANONICAL_KEYS) {
    const value = values[key];
    if (value !== undefined) {
      ordered[key] = value;
    }
  }
  return JSON.stringify(ordered);
}

export function canonicalOrderPayloadHash(
  body: CanonicalOrderPayloadInput,
): string {
  return createHash('sha256').update(canonicalOrderPayload(body)).digest('hex');
}
