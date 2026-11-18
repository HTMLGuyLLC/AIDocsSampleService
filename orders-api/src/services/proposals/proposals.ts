import { badRequest, conflict, notFound } from '../../lib/errors.ts';
import { log as defaultLog, type Logger } from '../../lib/log.ts';
import type { Orders } from '../orders/orders.ts';

export const PROPOSAL_TTL_MS = 15 * 60 * 1000;
export const UNDO_WINDOW_MS = 24 * 60 * 60 * 1000;

/** The only fields a proposal can change. Price, total and status are not on this list and never will be. */
export type ProposalField = 'pickupAt';

export interface Proposal {
  id: string;
  orderId: string;
  field: ProposalField;
  /** Read from the stored order when proposed. */
  before: string | null;
  /** Worked out by our code from stored data when proposed. Never copied from model text. */
  after: string;
  createdAt: string;
  expiresAt: string;
  status: 'open' | 'confirmed' | 'undone';
  confirmedAt?: string;
  confirmedBy?: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  /** Who did it: the staff user who confirmed or undid. */
  actor: string;
  action: 'confirm' | 'undo';
  proposalId: string;
  orderId: string;
  field: ProposalField;
  before: string | null;
  after: string | null;
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_TIME = /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday) (\d{1,2})(?::(\d{2}))?(am|pm)$/;

/**
 * Turns "saturday 9am" into the next such time after `from`, as an ISO string in UTC.
 * Returns null for anything that is not exactly that shape, so odd text never becomes a date.
 */
export function resolvePickup(text: string, from: Date): string | null {
  const m = DAY_TIME.exec(text.trim().toLowerCase());
  if (!m) return null;
  const hour12 = Number(m[2]);
  const minute = Number(m[3] ?? '0');
  if (hour12 < 1 || hour12 > 12 || minute > 59) return null;
  const hour = (hour12 % 12) + (m[4] === 'pm' ? 12 : 0);
  const target = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), hour, minute));
  let ahead = (DAYS.indexOf(m[1] as string) - from.getUTCDay() + 7) % 7;
  if (ahead === 0 && target <= from) ahead = 7;
  target.setUTCDate(target.getUTCDate() + ahead);
  return target.toISOString();
}

interface Deps {
  orders: Pick<Orders, 'get' | 'setPickupAt'>;
  now?: () => Date;
  log?: Logger;
}

/**
 * Proposals: the only way AI output can lead to a change on an order, and only after a person confirms.
 * `propose` is the one function AI code gets (see `Proposer`). Rules: AGENTS.md here and docs/proposals.md.
 */
export function createProposals({ orders, now = () => new Date(), log = defaultLog }: Deps) {
  const proposals = new Map<string, Proposal>();
  const audit: AuditEntry[] = [];
  let nextProposal = 1;

  const find = (id: string): Proposal => {
    const proposal = proposals.get(id);
    if (!proposal) throw notFound('Proposal');
    return proposal;
  };

  const record = (actor: string, action: AuditEntry['action'], p: Proposal, before: string | null, after: string | null) => {
    audit.push({ id: `aud_${audit.length + 1}`, at: now().toISOString(), actor, action, proposalId: p.id, orderId: p.orderId, field: p.field, before, after });
  };

  const checkActor = (actor: string) => {
    if (typeof actor !== 'string' || actor.trim() === '' || actor.length > 80) throw badRequest('actor must be the name of the person confirming');
  };

  return {
    /**
     * Writes down a suggestion. The order does not change. The caller names only the order and the field:
     * the before and after come from the stored order, never from anything the caller or a model supplies.
     */
    propose(input: { orderId: string; field: ProposalField }): Proposal {
      if (input.field !== 'pickupAt') throw badRequest('Only pickupAt can be proposed');
      const order = orders.get(input.orderId);
      const text = order.noteDetails?.pickupAt;
      const after = text ? resolvePickup(text, new Date(order.createdAt)) : null;
      if (!after) throw badRequest('The order has no pickup time that can be proposed');
      const before = order.pickupAt ?? null;
      if (before === after) throw conflict('The order already has this pickup time');

      const open = [...proposals.values()].find((p) => p.orderId === order.id && p.field === 'pickupAt' && p.status === 'open' && p.after === after && p.before === before && now() < new Date(p.expiresAt));
      if (open) return { ...open };

      const createdAt = now();
      const proposal: Proposal = {
        id: `prop_${nextProposal++}`,
        orderId: order.id,
        field: 'pickupAt',
        before,
        after,
        createdAt: createdAt.toISOString(),
        expiresAt: new Date(createdAt.getTime() + PROPOSAL_TTL_MS).toISOString(),
        status: 'open',
      };
      proposals.set(proposal.id, proposal);
      log('info', 'proposal created', { orderId: order.id, proposalId: proposal.id, field: proposal.field });
      return { ...proposal };
    },

    /** A person says yes. Applies the proposal and writes the audit entry. 409 if it expired, was used, or the order changed meanwhile. */
    confirm(id: string, actor: string): Proposal {
      checkActor(actor);
      const proposal = find(id);
      if (proposal.status !== 'open') throw conflict(`Proposal is already ${proposal.status}`);
      if (now() >= new Date(proposal.expiresAt)) throw conflict('Proposal expired');
      if ((orders.get(proposal.orderId).pickupAt ?? null) !== proposal.before) throw conflict('The order changed since this was proposed');

      orders.setPickupAt(proposal.orderId, proposal.after);
      proposal.status = 'confirmed';
      proposal.confirmedAt = now().toISOString();
      proposal.confirmedBy = actor;
      record(actor, 'confirm', proposal, proposal.before, proposal.after);
      log('info', 'proposal confirmed', { orderId: proposal.orderId, proposalId: proposal.id, actor });
      return { ...proposal };
    },

    /** Puts the old value back. Only within 24 hours of confirming, and only if nothing changed the field since. */
    undo(id: string, actor: string): Proposal {
      checkActor(actor);
      const proposal = find(id);
      if (proposal.status !== 'confirmed' || !proposal.confirmedAt) throw conflict(`Only confirmed proposals can be undone; this one is ${proposal.status}`);
      if (now().getTime() - new Date(proposal.confirmedAt).getTime() > UNDO_WINDOW_MS) throw conflict('Undo window (24 hours) has passed');
      if ((orders.get(proposal.orderId).pickupAt ?? null) !== proposal.after) throw conflict('The order changed since this was confirmed, so it cannot be undone');

      orders.setPickupAt(proposal.orderId, proposal.before);
      proposal.status = 'undone';
      record(actor, 'undo', proposal, proposal.after, proposal.before);
      log('info', 'proposal undone', { orderId: proposal.orderId, proposalId: proposal.id, actor });
      return { ...proposal };
    },

    get(id: string): Proposal {
      return { ...find(id) };
    },

    auditLog(): AuditEntry[] {
      return audit.map((entry) => ({ ...entry }));
    },
  };
}

export type Proposals = ReturnType<typeof createProposals>;

/** What AI code is handed: `propose` and nothing else. It cannot confirm, undo or touch an order. */
export type Proposer = Pick<Proposals, 'propose'>;
