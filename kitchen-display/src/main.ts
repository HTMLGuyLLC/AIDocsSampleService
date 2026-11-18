import { buildBakeList, formatBakeList } from './bake-list.ts';
import { createOrdersClient } from './orders-client.ts';

const secret = process.env.KITCHEN_DISPLAY_SECRET;
if (!secret) {
  console.error('KITCHEN_DISPLAY_SECRET is not set. Run scripts/load-secrets.sh (see docs/secrets.md at the repo root).');
  process.exit(1);
}

const client = createOrdersClient({ baseUrl: process.env.ORDERS_API_URL ?? 'http://localhost:3000', secret });
console.log(formatBakeList(buildBakeList(await client.listOrders())));
