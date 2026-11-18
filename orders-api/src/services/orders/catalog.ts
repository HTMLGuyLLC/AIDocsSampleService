import type { Cents } from '../../lib/money.ts';

export interface Product {
  sku: string;
  name: string;
  priceCents: Cents;
}

/** What the bakery sells. Prices are copied onto each order when it is created. */
export const catalog: ReadonlyMap<string, Product> = new Map<string, Product>([
  ['SOUR-LOAF', { sku: 'SOUR-LOAF', name: 'Sourdough loaf', priceCents: 850 }],
  ['CROIS-6', { sku: 'CROIS-6', name: 'Croissants, box of 6', priceCents: 1500 }],
  ['BAGEL-12', { sku: 'BAGEL-12', name: 'Bagels, dozen', priceCents: 1800 }],
  ['COOKIE', { sku: 'COOKIE', name: 'Chocolate chip cookie', priceCents: 275 }],
]);
