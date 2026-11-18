/**
 * The brakes: a kill switch and a daily budget. Check them BEFORE every model call.
 * Rules: ../../../../docs/ai-safety-and-cost.md
 */
import { tooManyRequests, unavailable } from '../errors.ts';

export interface Reservation {
  day: string;
  micros: number;
  settled: boolean;
}

export function createGuard({
  dailyBudgetMicros,
  enabled = true,
  now = () => new Date(),
}: {
  /** The most we may spend in one UTC day, in micros of a dollar. */
  dailyBudgetMicros: number;
  enabled?: boolean;
  now?: () => Date;
}) {
  let on = enabled;
  const spentByDay = new Map<string, number>();
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
     * Throws 503 when the kill switch is off, 429 when the day's budget would be passed.
     */
    reserve(estimateMicros: number): Reservation {
      if (!on) throw unavailable('ai_disabled', 'AI features are switched off');
      const day = today();
      const spent = spentByDay.get(day) ?? 0;
      if (spent + estimateMicros > dailyBudgetMicros) throw tooManyRequests('ai_budget_exhausted', 'Daily AI budget is used up');
      spentByDay.set(day, spent + estimateMicros);
      return { day, micros: estimateMicros, settled: false };
    },

    /** Swaps the estimate for the real cost once the call finished. A call that failed is never settled, so it keeps its reservation. */
    settle(reservation: Reservation, actualMicros: number): void {
      if (reservation.settled) return;
      reservation.settled = true;
      spentByDay.set(reservation.day, (spentByDay.get(reservation.day) ?? 0) - reservation.micros + actualMicros);
    },

    spentToday(): number {
      return spentByDay.get(today()) ?? 0;
    },

    dailyBudgetMicros,
  };
}

export type Guard = ReturnType<typeof createGuard>;
