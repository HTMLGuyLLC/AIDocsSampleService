import type { Route } from '../../lib/http.ts';
import { badRequest } from '../../lib/errors.ts';
import { verifySignature } from '../../lib/auth.ts';
import { MAX_NOTE_LENGTH } from '../order-notes/order-notes.ts';
import type { NewOrder, Orders } from './orders.ts';

interface Options {
  /** Caller name → shared secret, for `/internal/*` routes. See docs/auth.md at the repo root. */
  callerSecrets?: Readonly<Record<string, string>>;
  now?: () => Date;
}

export function orderRoutes(orders: Orders, { callerSecrets = {}, now = () => new Date() }: Options = {}): Route[] {
  return [
    { method: 'GET', path: '/orders', handler: () => ({ status: 200, body: orders.list() }) },
    {
      // For other services. Must be signed, so the full list (emails, notes) isn't open to anyone who can reach us.
      method: 'GET',
      path: '/internal/orders',
      handler: ({ method, path, rawBody, headers }) => {
        verifySignature({ method, path, rawBody, headers, secrets: callerSecrets, now: now() });
        return { status: 200, body: orders.list() };
      },
    },
    {
      method: 'POST',
      path: '/orders',
      handler: async ({ body }) => {
        if (!body || typeof body !== 'object') throw badRequest('Send a JSON body with customerEmail and items');
        const { note, ...input } = body as NewOrder & { note?: unknown };
        if (note !== undefined && (typeof note !== 'string' || note.trim() === '' || note.length > MAX_NOTE_LENGTH)) {
          throw badRequest(`note must be text up to ${MAX_NOTE_LENGTH} characters`);
        }
        const order = orders.create(input as NewOrder);
        return { status: 201, body: typeof note === 'string' ? await orders.addNote(order.id, note) : order };
      },
    },
    { method: 'GET', path: '/orders/:id', handler: ({ params }) => ({ status: 200, body: orders.get(params.id ?? '') }) },
    {
      method: 'POST',
      path: '/orders/:id/pay',
      handler: async ({ params }) => ({ status: 200, body: await orders.pay(params.id ?? '') }),
    },
    {
      method: 'POST',
      path: '/orders/:id/refund',
      handler: async ({ params }) => ({ status: 200, body: await orders.refund(params.id ?? '') }),
    },
  ];
}
