import { signedHeaders } from './sign.ts';

export interface OrderLine {
  sku: string;
  name: string;
  quantity: number;
}

export interface Order {
  id: string;
  status: 'pending' | 'paid' | 'refunded';
  lines: OrderLine[];
  noteDetails?: { allergies: string[] };
}

interface Options {
  baseUrl: string;
  /** Our name, as orders-api knows us. */
  caller?: string;
  /** Our shared secret. From the vault: ../../docs/secrets.md. */
  secret: string;
  fetch?: typeof fetch;
  now?: () => Date;
}

/** Reads orders from orders-api's signed `/internal/orders` route. */
export function createOrdersClient({ baseUrl, caller = 'kitchen-display', secret, fetch: doFetch = fetch, now = () => new Date() }: Options) {
  return {
    async listOrders(): Promise<Order[]> {
      const path = '/internal/orders';
      const res = await doFetch(baseUrl + path, { headers: signedHeaders({ caller, method: 'GET', path, secret, now: now() }) });
      if (!res.ok) throw new Error(`orders-api answered ${res.status}`);
      return (await res.json()) as Order[];
    },
  };
}
