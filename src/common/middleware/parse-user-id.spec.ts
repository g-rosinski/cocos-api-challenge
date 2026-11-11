import { parseUserId } from './parse-user-id.js';

describe('parseUserId', () => {
  it.each([
    { input: undefined, expected: null },
    { input: '', expected: null },
    { input: '   ', expected: null },
    { input: '0', expected: null },
    { input: '-1', expected: null },
    { input: 'abc', expected: null },
    { input: '1', expected: 1 },
    { input: '999', expected: 999 },
  ])('parses $input as $expected', ({ input, expected }) => {
    expect(parseUserId(input)).toBe(expected);
  });
});
