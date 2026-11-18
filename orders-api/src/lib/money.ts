/**
 * Money is always a whole number of cents. Never use floats for money.
 * Why: docs/decisions/0002-money-in-cents.md
 */
export type Cents = number;

export function assertCents(value: number, label = 'amount'): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative whole number of cents, got ${value}`);
  }
}

export function formatCents(cents: Cents): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** A percentage of an amount, rounded half up to the nearest cent. */
export function percentOf(cents: Cents, percent: number): Cents {
  return Math.round((cents * percent) / 100);
}
