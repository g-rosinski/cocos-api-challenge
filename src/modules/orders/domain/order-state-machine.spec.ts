import { isOrderAccepted } from '@/modules/orders/domain/validators/order-acceptance';
import { OrderStateMachine } from '@/modules/orders/domain/order-state-machine';
import { FilledOrderState } from '@/modules/orders/domain/states/filled-order-state';
import { NewOrderState } from '@/modules/orders/domain/states/new-order-state';

describe('OrderStateMachine', () => {
  const machine = new OrderStateMachine();
  const filled = new FilledOrderState();
  const open = new NewOrderState();

  it('fills a market order when cash covers the notional', () => {
    expect(
      machine.decide(filled, {
        side: 'BUY',
        size: 1,
        price: 925.85,
        availableCash: 925.85,
        availableShares: 0,
      }),
    ).toBe('FILLED');
  });

  it('leaves a limit order open when cash covers the notional', () => {
    expect(
      machine.decide(open, {
        side: 'BUY',
        size: 1,
        price: 710,
        availableCash: 710,
        availableShares: 0,
      }),
    ).toBe('NEW');
  });

  it.each([
    {
      name: 'insufficient cash',
      state: filled,
      input: {
        side: 'BUY' as const,
        size: 1,
        price: 925.85,
        availableCash: 925.84,
        availableShares: 40,
      },
    },
    {
      name: 'insufficient shares',
      state: filled,
      input: {
        side: 'SELL' as const,
        size: 1000,
        price: 925.85,
        availableCash: 0,
        availableShares: 40,
      },
    },
    {
      name: 'amount below one share',
      state: open,
      input: {
        side: 'BUY' as const,
        size: 0,
        price: 710,
        availableCash: 10_000,
        availableShares: 0,
      },
    },
    {
      name: 'sell below zero',
      state: filled,
      input: {
        side: 'SELL' as const,
        size: 3,
        price: 100,
        availableCash: 0,
        availableShares: 2,
      },
    },
  ])('rejects $name', ({ state, input }) => {
    expect(machine.decide(state, input)).toBe('REJECTED');
  });

  it('accepts a sell that uses the exact available shares', () => {
    expect(
      machine.decide(filled, {
        side: 'SELL',
        size: 40,
        price: 925.85,
        availableCash: 0,
        availableShares: 40,
      }),
    ).toBe('FILLED');
  });

  it('shares the acceptance rule used by both order types', () => {
    expect(
      isOrderAccepted({
        side: 'BUY',
        size: 1,
        price: 10,
        availableCash: 10,
        availableShares: 0,
      }),
    ).toBe(true);
    expect(
      isOrderAccepted({
        side: 'SELL',
        size: 1.5,
        price: 10,
        availableCash: 10,
        availableShares: 2,
      }),
    ).toBe(false);
  });
});
