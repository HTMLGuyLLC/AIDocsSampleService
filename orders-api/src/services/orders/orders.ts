import type { Cents } from '../../lib/money.ts';
import { badRequest, conflict, notFound } from '../../lib/errors.ts';
import type { Billing } from '../billing/billing.ts';
import { templates, type Notifier } from '../notifications/notifications.ts';
import { catalog } from './catalog.ts';
import { MAX_NOTE_LENGTH, type OrderNotes } from '../order-notes/order-notes.ts';
import type { NoteDetails } from '../order-notes/types.ts';
import { log } from '../../lib/log.ts';

/** Allowed moves: pending → paid → refunded. See docs/orders.md. */
export type OrderStatus = 'pending' | 'paid' | 'refunded';

export interface OrderLine {
  sku: string;
  name: string;
  quantity: number;
  unitPriceCents: Cents;
  lineTotalCents: Cents;
}

export interface Order {
  id: string;
  customerEmail: string;
  lines: OrderLine[];
  totalCents: Cents;
  status: OrderStatus;
  paymentId?: string;
  /** The customer's free-text note, as typed. Kitchen information only: it never changes the price. */
  note?: string;
  noteDetails?: NoteDetails;
  /** The official pickup time, ISO 8601 UTC. Set only by a person, or by confirming a proposal. Never read from a note directly. */
  pickupAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewOrder {
  customerEmail: string;
  items: { sku: string; quantity: number }[];
}

export const MAX_QUANTITY_PER_LINE = 50;

interface Deps {
  billing: Billing;
  notifier: Notifier;
  /** Reads customer notes. Without it, a note is stored as typed with no details. */
  orderNotes?: OrderNotes;
  /** Called after a note is stored and read. May only make proposals; it cannot change the order. A failure here never fails the note. */
  onNoteRead?: (order: Order) => void;
  now?: () => Date;
}

export function createOrders({ billing, notifier, orderNotes, onNoteRead, now = () => new Date() }: Deps) {
  const orders = new Map<string, Order>();
  let next = 1;

  const find = (id: string): Order => {
    const order = orders.get(id);
    if (!order) throw notFound('Order');
    return order;
  };

  /** Emails are best effort: a failed email must never undo a payment or refund. */
  const notify = async (email: Parameters<Notifier['send']>[0]) => {
    try {
      await notifier.send(email);
    } catch (err) {
      log('error', 'email failed, continuing', { error: err instanceof Error ? err.message : String(err) });
    }
  };

  return {
    create(input: NewOrder): Order {
      if (!input.customerEmail?.includes('@')) throw badRequest('customerEmail must be an email address');
      if (!Array.isArray(input.items) || input.items.length === 0) throw badRequest('items must not be empty');

      const lines = input.items.map(({ sku, quantity }): OrderLine => {
        const product = catalog.get(sku);
        if (!product) throw badRequest(`Unknown sku: ${sku}`);
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_LINE) {
          throw badRequest(`quantity must be a whole number from 1 to ${MAX_QUANTITY_PER_LINE}`);
        }
        return {
          sku,
          name: product.name,
          quantity,
          unitPriceCents: product.priceCents,
          lineTotalCents: product.priceCents * quantity,
        };
      });

      const timestamp = now().toISOString();
      const order: Order = {
        id: `ord_${next++}`,
        customerEmail: input.customerEmail,
        lines,
        totalCents: lines.reduce((sum, line) => sum + line.lineTotalCents, 0),
        status: 'pending',
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      orders.set(order.id, order);
      return structuredClone(order);
    },

    get(id: string): Order {
      return structuredClone(find(id));
    },

    list(): Order[] {
      return [...orders.values()].map((order) => structuredClone(order));
    },

    /** Adds a free-text note to a pending order. The note is read for kitchen details only; the total never changes. */
    async addNote(id: string, note: string): Promise<Order> {
      if (typeof note !== 'string' || note.trim() === '' || note.length > MAX_NOTE_LENGTH) {
        throw badRequest(`note must be text up to ${MAX_NOTE_LENGTH} characters`);
      }
      const order = find(id);
      if (order.status !== 'pending') throw conflict(`Notes can only be added to pending orders; this one is ${order.status}`);

      const details = orderNotes ? await orderNotes.parseNote(note, { orderId: order.id, customerEmail: order.customerEmail }) : undefined;
      order.note = note;
      if (details) order.noteDetails = details;
      order.updatedAt = now().toISOString();
      if (onNoteRead) {
        try {
          onNoteRead(structuredClone(order));
        } catch (err) {
          log('warn', 'note follow-up skipped', { orderId: order.id, error: err instanceof Error ? err.message : String(err) });
        }
      }
      return structuredClone(order);
    },

    /** Sets or clears the official pickup time. Used by the proposals service when a person confirms or undoes. Not for AI code. */
    setPickupAt(id: string, pickupAt: string | null): Order {
      const order = find(id);
      if (order.status === 'refunded') throw conflict('Refunded orders have no pickup');
      if (pickupAt !== null && (typeof pickupAt !== 'string' || Number.isNaN(Date.parse(pickupAt)))) throw badRequest('pickupAt must be an ISO 8601 date and time');
      if (pickupAt === null) delete order.pickupAt;
      else order.pickupAt = pickupAt;
      order.updatedAt = now().toISOString();
      return structuredClone(order);
    },

    async pay(id: string): Promise<Order> {
      const order = find(id);
      if (order.status !== 'pending') throw conflict(`Only pending orders can be paid; this one is ${order.status}`);

      const payment = await billing.charge(order.id, order.totalCents);
      order.status = 'paid';
      order.paymentId = payment.id;
      order.updatedAt = now().toISOString();

      await notify(templates.orderPaid(order));
      return structuredClone(order);
    },

    async refund(id: string): Promise<Order> {
      const order = find(id);
      if (order.status !== 'paid' || !order.paymentId) {
        throw conflict(`Only paid orders can be refunded; this one is ${order.status}`);
      }

      await billing.refund(order.paymentId);
      order.status = 'refunded';
      order.updatedAt = now().toISOString();

      await notify(templates.orderRefunded(order));
      return structuredClone(order);
    },
  };
}

export type Orders = ReturnType<typeof createOrders>;
