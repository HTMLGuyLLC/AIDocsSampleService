import type { Route } from '../../lib/http.ts';
import { notFound } from '../../lib/errors.ts';
import type { Billing } from './billing.ts';

export function billingRoutes(billing: Billing): Route[] {
  return [
    {
      method: 'GET',
      path: '/payments/:id',
      handler: ({ params }) => {
        const payment = billing.get(params.id ?? '');
        if (!payment) throw notFound('Payment');
        return { status: 200, body: payment };
      },
    },
  ];
}
