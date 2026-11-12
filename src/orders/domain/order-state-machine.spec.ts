import { isOrderAccepted } from './order-acceptance.js';
import { IllegalOrderTransitionError } from './illegal-order-transition.error.js';
import { OrderStateMachine } from './order-state-machine.js';

describe('OrderStateMachine', () => {
  const machine = new OrderStateMachine();

  it('fills a market order when cash covers the notional', () => {
    expect(
      machine.decide({
        acceptedStatus: 'FILLED',
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
      machine.decide({
        acceptedStatus: 'NEW',
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
      input: {
        acceptedStatus: 'FILLED',
        side: 'BUY' as const,
        size: 1,
        price: 925.85,
        availableCash: 925.84,
        availableShares: 40,
      },
    },
    {
      name: 'insufficient shares',
      input: {
        acceptedStatus: 'FILLED',
        side: 'SELL' as const,
        size: 1000,
        price: 925.85,
        availableCash: 0,
        availableShares: 40,
      },
    },
    {
      name: 'amount below one share',
      input: {
        acceptedStatus: 'NEW',
        side: 'BUY' as const,
        size: 0,
        price: 710,
        availableCash: 10_000,
        availableShares: 0,
      },
    },
    {
      name: 'sell below zero',
      input: {
        acceptedStatus: 'FILLED',
        side: 'SELL' as const,
        size: 3,
        price: 100,
        availableCash: 0,
        availableShares: 2,
      },
    },
  ])('rejects $name', ({ input }) => {
    expect(machine.decide(input)).toBe('REJECTED');
  });

  it('accepts a sell that uses the exact available shares', () => {
    expect(
      machine.decide({
        acceptedStatus: 'FILLED',
        side: 'SELL',
        size: 40,
        price: 925.85,
        availableCash: 0,
        availableShares: 40,
      }),
    ).toBe('FILLED');
  });

  it('rejects a transition outside the diagram', () => {
    expect(() =>
      machine.decide({
        acceptedStatus: 'CANCELLED',
        side: 'BUY',
        size: 1,
        price: 1,
        availableCash: 100,
        availableShares: 0,
      }),
    ).toThrow(IllegalOrderTransitionError);
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
