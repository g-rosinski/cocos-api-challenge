import {
  filledCashDeltaCents,
  openBuyReserveCents,
  toCents,
} from '@/domain/ledger/cash-movement';

describe('cash-movement', () => {
  it('matches portfolio and availability cash for decimal prices', () => {
    const order = {
      side: 'BUY',
      status: 'FILLED',
      size: 3,
      price: 10.33,
    };
    const delta = filledCashDeltaCents(order);
    expect(delta).toBe(-3 * toCents(10.33));
    expect(delta / 100).toBe(-30.99);
  });

  it('reserves open limit buys in cents', () => {
    expect(
      openBuyReserveCents({
        side: 'BUY',
        status: 'NEW',
        type: 'LIMIT',
        size: 2,
        price: 710.15,
      }),
    ).toBe(2 * toCents(710.15));
  });
});
