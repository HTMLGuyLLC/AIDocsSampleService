/**
 * Smoke test for a running orders-api: health, create an order with a note, pay it, fetch the payment, check the totals in cents.
 * Usage: npm run smoke            (BASE_URL env, default http://localhost:3000)
 * Exit code 0 when every check passes, 1 when any fails.
 * It creates and pays a real order, so point it at dev or staging, never production.
 * Docs: docs/testing.md, and the post-deploy-check skill at the repo root.
 */
export interface SmokeCheck {
  name: string;
  ok: boolean;
  detail?: string;
}

export interface SmokeResult {
  ok: boolean;
  checks: SmokeCheck[];
}

const ITEMS = [
  { sku: 'BAGEL-12', quantity: 1 },
  { sku: 'SOUR-LOAF', quantity: 2 },
];
/** 1 x 1800 + 2 x 850. Prices come from the catalog; update this when they change. */
const EXPECTED_TOTAL_CENTS = 3500;

export async function runSmoke(baseUrl: string, { timeoutMs = 10_000 }: { timeoutMs?: number } = {}): Promise<SmokeResult> {
  const checks: SmokeCheck[] = [];
  const call = async (method: string, path: string, body?: unknown): Promise<{ status: number; json: any }> => {
    const res = await fetch(new URL(path, baseUrl), {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    return { status: res.status, json: await res.json().catch(() => null) };
  };
  const check = (name: string, ok: boolean, detail?: string): boolean => {
    checks.push({ name, ok, ...(ok || !detail ? {} : { detail }) });
    return ok;
  };
  const step = async (name: string, fn: () => Promise<boolean>): Promise<boolean> => {
    try {
      return await fn();
    } catch (err) {
      return check(name, false, err instanceof Error ? err.message : String(err));
    }
  };

  const healthy = await step('health', async () => {
    const r = await call('GET', '/health');
    return check('health', r.status === 200 && r.json?.ok === true, `status ${r.status}`);
  });
  if (!healthy) return { ok: false, checks };

  let orderId = '';
  const created = await step('create order', async () => {
    const r = await call('POST', '/orders', { customerEmail: 'smoke-test@example.com', items: ITEMS, note: 'Smoke test. No nuts please.' });
    const o = r.json;
    orderId = String(o?.id ?? '');
    const lines: { lineTotalCents: number }[] = Array.isArray(o?.lines) ? o.lines : [];
    const sum = lines.reduce((total, l) => total + l.lineTotalCents, 0);
    return (
      check('create order: 201 and pending', r.status === 201 && o?.status === 'pending', `status ${r.status}`) &&
      check('create order: total is whole cents and matches the lines', Number.isInteger(o?.totalCents) && o.totalCents === sum && o.totalCents === EXPECTED_TOTAL_CENTS, `totalCents ${o?.totalCents}, lines ${sum}, expected ${EXPECTED_TOTAL_CENTS}`) &&
      check('create order: note stored', typeof o?.note === 'string' && o.note.length > 0)
    );
  });
  if (!created) return { ok: false, checks };

  let paymentId = '';
  const paid = await step('pay order', async () => {
    const r = await call('POST', `/orders/${orderId}/pay`);
    paymentId = String(r.json?.paymentId ?? '');
    return check('pay order: 200 and paid, with a payment id', r.status === 200 && r.json?.status === 'paid' && paymentId !== '', `status ${r.status}`);
  });
  if (!paid) return { ok: false, checks };

  await step('fetch payment', async () => {
    const r = await call('GET', `/payments/${paymentId}`);
    return check('payment amount equals the order total in cents', r.status === 200 && r.json?.amountCents === EXPECTED_TOTAL_CENTS, `status ${r.status}, amountCents ${r.json?.amountCents}`);
  });

  return { ok: checks.every((c) => c.ok), checks };
}

if (import.meta.main) {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const result = await runSmoke(baseUrl);
  for (const c of result.checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? ` (${c.detail})` : ''}`);
  console.log(result.ok ? `Smoke test passed against ${baseUrl}` : `Smoke test FAILED against ${baseUrl}`);
  process.exit(result.ok ? 0 : 1);
}
