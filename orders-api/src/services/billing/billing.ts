import { assertCents, type Cents } from '../../lib/money.ts';
import { badRequest, conflict, notFound } from '../../lib/errors.ts';

export type PaymentStatus = 'succeeded' | 'refunded';

export interface Payment {
  id: string;
  orderId: string;
  amountCents: Cents;
  status: PaymentStatus;
  createdAt: string;
  refundedAt?: string;
}

/**
 * The outside payment provider. In production this would be Stripe or similar.
 * Here it is faked so the sample runs with no accounts or keys.
 */
export interface PaymentProvider {
  charge(amountCents: Cents, idempotencyKey: string): Promise<{ providerId: string }>;
  refund(providerId: string): Promise<void>;
}

export interface Billing {
  /** Charge an order. Calling it twice for the same order returns the first payment. */
  charge(orderId: string, amountCents: Cents): Promise<Payment>;
  /** Refund a payment in full. Partial refunds are not supported. */
  refund(paymentId: string): Promise<Payment>;
  get(paymentId: string): Payment | undefined;
}

export function createBilling(provider: PaymentProvider, now: () => Date = () => new Date()): Billing {
  const payments = new Map<string, Payment>();
  const paymentIdByOrder = new Map<string, string>();

  return {
    async charge(orderId, amountCents) {
      assertCents(amountCents, 'amountCents');
      if (amountCents === 0) throw badRequest('Cannot charge an amount of zero');

      const existingId = paymentIdByOrder.get(orderId);
      const existing = existingId ? payments.get(existingId) : undefined;
      if (existing) return { ...existing };

      const { providerId } = await provider.charge(amountCents, `order:${orderId}`);
      const payment: Payment = {
        id: providerId,
        orderId,
        amountCents,
        status: 'succeeded',
        createdAt: now().toISOString(),
      };
      payments.set(payment.id, payment);
      paymentIdByOrder.set(orderId, payment.id);
      return { ...payment };
    },

    async refund(paymentId) {
      const payment = payments.get(paymentId);
      if (!payment) throw notFound('Payment');
      if (payment.status === 'refunded') throw conflict('Payment is already refunded');

      await provider.refund(payment.id);
      payment.status = 'refunded';
      payment.refundedAt = now().toISOString();
      return { ...payment };
    },

    get(paymentId) {
      const payment = payments.get(paymentId);
      return payment ? { ...payment } : undefined;
    },
  };
}

/** A provider that always succeeds. Used by tests and local runs. */
export function createFakeProvider(): PaymentProvider {
  let next = 1;
  return {
    async charge() {
      return { providerId: `pay_${next++}` };
    },
    async refund() {},
  };
}
