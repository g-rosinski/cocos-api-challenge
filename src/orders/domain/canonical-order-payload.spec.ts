import { createHash } from 'node:crypto';
import {
  canonicalOrderPayload,
  canonicalOrderPayloadHash,
} from './canonical-order-payload.js';

describe('canonicalOrderPayload', () => {
  it('orders keys and keeps size without a price', () => {
    const body = {
      type: 'MARKET' as const,
      side: 'BUY' as const,
      instrument_id: 47,
      size: 1,
    };

    const json = canonicalOrderPayload(body);

    expect(json).toBe(
      '{"instrument_id":47,"side":"BUY","size":1,"type":"MARKET"}',
    );
    expect(canonicalOrderPayloadHash(body)).toBe(
      createHash('sha256').update(json).digest('hex'),
    );
  });

  it('includes amount and price when those fields arrive', () => {
    expect(
      canonicalOrderPayload({
        instrument_id: 45,
        side: 'BUY',
        type: 'LIMIT',
        amount: 1000,
        price: 710,
      }),
    ).toBe(
      '{"amount":1000,"instrument_id":45,"price":710,"side":"BUY","type":"LIMIT"}',
    );
  });

  it('changes the hash when only the limit price changes', () => {
    const base = {
      instrument_id: 45,
      side: 'BUY' as const,
      type: 'LIMIT' as const,
      size: 1,
    };

    expect(canonicalOrderPayloadHash({ ...base, price: 710 })).not.toBe(
      canonicalOrderPayloadHash({ ...base, price: 711 }),
    );
  });
});
