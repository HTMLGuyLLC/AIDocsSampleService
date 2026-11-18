import type { Route } from '../../lib/http.ts';
import type { UsageLedger } from '../../lib/ai/usage.ts';
import type { Guard } from '../../lib/ai/guard.ts';

/** Dashboard data for AI spend. In a real deployment this sits behind staff login. */
export function aiAdminRoutes(usage: UsageLedger, guard: Guard): Route[] {
  return [
    {
      method: 'GET',
      path: '/admin/ai-usage',
      handler: () => ({
        status: 200,
        body: {
          ...usage.summary(),
          enabled: guard.enabled,
          spentTodayMicros: guard.spentToday(),
          dailyBudgetMicros: guard.dailyBudgetMicros,
        },
      }),
    },
  ];
}
