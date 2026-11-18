import type { Order } from './orders-client.ts';

export interface BakeItem {
  sku: string;
  name: string;
  quantity: number;
  /** Allergies mentioned on orders that include this item, with the orders to check. */
  allergyFlags: { allergy: string; orderIds: string[] }[];
}

/**
 * Today's bake list: each sku with its total quantity across paid orders.
 * Only paid orders count: a pending order might never be paid, and a refunded one is not wanted.
 */
export function buildBakeList(orders: Order[]): BakeItem[] {
  const items = new Map<string, BakeItem>();
  for (const order of orders) {
    if (order.status !== 'paid') continue;
    for (const line of order.lines) {
      const item = items.get(line.sku) ?? { sku: line.sku, name: line.name, quantity: 0, allergyFlags: [] };
      item.quantity += line.quantity;
      for (const allergy of order.noteDetails?.allergies ?? []) {
        const flag = item.allergyFlags.find((f) => f.allergy === allergy) ?? { allergy, orderIds: [] };
        if (!item.allergyFlags.includes(flag)) item.allergyFlags.push(flag);
        if (!flag.orderIds.includes(order.id)) flag.orderIds.push(order.id);
      }
      items.set(line.sku, item);
    }
  }
  return [...items.values()].sort((a, b) => a.sku.localeCompare(b.sku));
}

/** Plain text for the screen. */
export function formatBakeList(list: BakeItem[]): string {
  if (list.length === 0) return 'Nothing to bake yet.';
  return list
    .map((item) => {
      const flags = item.allergyFlags.map((f) => `  ALLERGY ${f.allergy}: ${f.orderIds.join(', ')}`);
      return [`${String(item.quantity).padStart(3)} x ${item.name} (${item.sku})`, ...flags].join('\n');
    })
    .join('\n');
}
