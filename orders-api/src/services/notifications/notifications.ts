import { formatCents, type Cents } from '../../lib/money.ts';

export interface Email {
  to: string;
  subject: string;
  body: string;
}

export interface Notifier {
  send(email: Email): Promise<void>;
}

/** Collects emails in memory instead of sending them. Used by tests and local runs. */
export function createOutboxNotifier(): Notifier & { outbox: Email[] } {
  const outbox: Email[] = [];
  return {
    outbox,
    async send(email) {
      outbox.push(email);
    },
  };
}

interface OrderSummary {
  id: string;
  customerEmail: string;
  totalCents: Cents;
}

/** Every customer email lives here, so wording stays in one place. */
export const templates = {
  orderPaid(order: OrderSummary): Email {
    return {
      to: order.customerEmail,
      subject: `Order ${order.id} confirmed`,
      body: `Thanks! We received ${formatCents(order.totalCents)} for order ${order.id}. We'll email you when it's ready for pickup.`,
    };
  },
  orderRefunded(order: OrderSummary): Email {
    return {
      to: order.customerEmail,
      subject: `Order ${order.id} refunded`,
      body: `We refunded ${formatCents(order.totalCents)} for order ${order.id}. It can take 5 to 10 business days to show up.`,
    };
  },
};
