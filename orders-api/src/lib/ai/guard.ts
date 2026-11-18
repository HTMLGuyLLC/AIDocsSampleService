/**
 * The brakes: a kill switch and a daily budget. Check them BEFORE every model call.
 * Rules: ../../../../docs/ai-safety-and-cost.md
 */
import { createHash } from 'node:crypto';
import { tooManyRequests, unavailable } from '../errors.ts';

export interface Reservation {
  day: string;
  micros: number;
  /** Hashed customer key, when the call was reserved for one customer. */
  customer?: string;
  settled: boolean;
}

/** A short hash of the customer's key (their email). The ledger and any log only ever see this, never the email. */
export function customerId(key: string): string {
  return createHash('sha256').update(key.trim().toLowerCase()).digest('hex').slice(0, 12);
}

export function createGuard({
  dailyBudgetMicros,
  perCustomerDailyMicros = Infinity,
  enabled = true,
  now = () => new Date(),
}: {
  /** The most we may spend in one UTC day, in micros of a dollar. */
  dailyBudgetMicros: number;
  /** The most one customer may use in one UTC day, in micros. Default: no per-customer cap. */
  perCustomerDailyMicros?: number;
  enabled?: boolean;
  now?: () => Date;
}) {
  let on = enabled;
  const spentByDay = new Map<string, number>();
  const spentByCustomer = new Map<string, number>();
  const slot = (day: string, customer: string) => `${day}|${customer}`;
  const today = () => now().toISOString().slice(0, 10);

  return {
    get enabled(): boolean {
      return on;
    },

    /** The kill switch. Off means no model calls at all. */
    setEnabled(value: boolean): void {
      on = value;
    },

    /**
     * Sets money aside for a call that is about to happen.
     * Reserves against the overall daily budget and, when a customer key is given, that customer's daily cap.
     * Throws 503 when the kill switch is off, 429 when either cap would be passed. Nothing is reserved when it throws.
     * `customerKey` is the order's customerEmail. It is hashed here and never stored or logged as given.
     */
    reserve(estimateMicros: number, customerKey?: string): Reservation {
      if (!on) throw unavailable('ai_disabled', 'AI features are switched off');
      const day = today();
      const spent = spentByDay.get(day) ?? 0;
      if (spent + estimateMicros > dailyBudgetMicros) throw tooManyRequests('ai_budget_exhausted', 'Daily AI budget is used up');
      const customer = customerKey ? customerId(customerKey) : undefined;
      if (customer) {
        const used = spentByCustomer.get(slot(day, customer)) ?? 0;
        if (used + estimateMicros > perCustomerDailyMicros) throw tooManyRequests('ai_customer_cap', 'Daily AI cap for this customer is used up');
        spentByCustomer.set(slot(day, customer), used + estimateMicros);
      }
      spentByDay.set(day, spent + estimateMicros);
      return { day, micros: estimateMicros, customer, settled: false };
    },

    /** Swaps the estimate for the real cost once the call finished. A call that failed is never settled, so it keeps its reservation. */
    settle(reservation: Reservation, actualMicros: number): void {
      if (reservation.settled) return;
      reservation.settled = true;
      const delta = actualMicros - reservation.micros;
      spentByDay.set(reservation.day, (spentByDay.get(reservation.day) ?? 0) + delta);
      if (reservation.customer) {
        const key = slot(reservation.day, reservation.customer);
        spentByCustomer.set(key, (spentByCustomer.get(key) ?? 0) + delta);
      }
    },

    spentToday(): number {
      return spentByDay.get(today()) ?? 0;
    },

    /** What this customer has used today, in micros. Pass the same key you reserved with. */
    spentTodayByCustomer(key: string): number {
      return spentByCustomer.get(slot(today(), customerId(key))) ?? 0;
    },

    dailyBudgetMicros,
    perCustomerDailyMicros,
  };
}

export type Guard = ReturnType<typeof createGuard>;
