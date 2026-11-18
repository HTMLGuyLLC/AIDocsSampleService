import { createGuard, type Guard } from './lib/ai/guard.ts';
import { createDefaultModel, type ModelClient } from './lib/ai/model.ts';
import { createUsageLedger, type UsageLedger } from './lib/ai/usage.ts';
import { createRouter } from './lib/http.ts';
import { createBilling, createFakeProvider } from './services/billing/billing.ts';
import { billingRoutes } from './services/billing/routes.ts';
import { createOutboxNotifier } from './services/notifications/notifications.ts';
import { createOrderNotes } from './services/order-notes/order-notes.ts';
import { aiAdminRoutes } from './services/order-notes/routes.ts';
import { createOrders } from './services/orders/orders.ts';
import { orderRoutes } from './services/orders/routes.ts';

interface Options {
  model?: ModelClient;
  usage?: UsageLedger;
  guard?: Guard;
  /** Caller name → shared secret for signed `/internal/*` routes. Defaults to values from the environment. */
  callerSecrets?: Record<string, string>;
  now?: () => Date;
}

/** Secrets arrive as environment variables, loaded from the vault by scripts/load-secrets.sh. Never hard-code them. */
function secretsFromEnv(): Record<string, string> {
  const secret = process.env.KITCHEN_DISPLAY_SECRET;
  return secret ? { 'kitchen-display': secret } : {};
}

/** Wires the services together. The only place that decides which provider, notifier and model are used. */
export function createApp(options: Options = {}) {
  const now = options.now ?? (() => new Date());
  const usage = options.usage ?? createUsageLedger({ now });
  const guard =
    options.guard ??
    createGuard({
      dailyBudgetMicros: Number(process.env.AI_DAILY_BUDGET_MICROS ?? 1_000_000),
      enabled: process.env.AI_ENABLED !== 'false',
      now,
    });
  const orderNotes = createOrderNotes({ model: options.model ?? createDefaultModel(), guard, usage });

  const billing = createBilling(createFakeProvider());
  const notifier = createOutboxNotifier();
  const orders = createOrders({ billing, notifier, orderNotes, now });

  const handler = createRouter([
    { method: 'GET', path: '/health', handler: () => ({ status: 200, body: { ok: true } }) },
    ...orderRoutes(orders, { callerSecrets: options.callerSecrets ?? secretsFromEnv(), now }),
    ...billingRoutes(billing),
    ...aiAdminRoutes(usage, guard),
  ]);

  return { handler, billing, notifier, orders, usage, guard };
}
