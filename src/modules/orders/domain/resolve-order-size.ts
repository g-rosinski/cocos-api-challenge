export function resolveOrderSize(input: {
  size?: number;
  amount?: number;
  price: number;
}): number {
  if (input.size !== undefined) {
    return input.size;
  }
  if (input.amount === undefined) {
    return 0;
  }
  const priceCents = Math.round(input.price * 100);
  if (priceCents <= 0) {
    return 0;
  }
  const amountCents = Math.round(input.amount * 100);
  return Math.floor(amountCents / priceCents);
}
