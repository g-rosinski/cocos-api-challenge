export const numericMoneyTransformer = {
  to: (value: number): number => value,
  from: (value: string | number): number => {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)) {
      return Number.NaN;
    }
    return Math.round(parsed * 100) / 100;
  },
};
