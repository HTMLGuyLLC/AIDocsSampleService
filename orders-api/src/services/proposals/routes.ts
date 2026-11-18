import { badRequest } from '../../lib/errors.ts';
import type { Route } from '../../lib/http.ts';
import type { Proposals } from './proposals.ts';

/** Who is acting. In a real deployment this comes from staff login; here it is a header so the sample stays small. */
function actorFrom(headers: Record<string, string | string[] | undefined>): string {
  const actor = headers['x-staff-user'];
  if (typeof actor !== 'string' || actor.trim() === '') throw badRequest('Send the x-staff-user header with the name of the person acting');
  return actor.trim();
}

/** There is no route to create a proposal: only code on the server can. People can only look, confirm or undo. */
export function proposalRoutes(proposals: Proposals): Route[] {
  return [
    { method: 'GET', path: '/proposals/:id', handler: ({ params }) => ({ status: 200, body: proposals.get(params.id ?? '') }) },
    { method: 'POST', path: '/proposals/:id/confirm', handler: ({ params, headers }) => ({ status: 200, body: proposals.confirm(params.id ?? '', actorFrom(headers)) }) },
    { method: 'POST', path: '/proposals/:id/undo', handler: ({ params, headers }) => ({ status: 200, body: proposals.undo(params.id ?? '', actorFrom(headers)) }) },
    { method: 'GET', path: '/admin/audit', handler: () => ({ status: 200, body: proposals.auditLog() }) },
  ];
}
