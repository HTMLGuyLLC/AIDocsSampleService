import type { Cents } from '../../lib/money.ts';

/** How one supplier's CSV maps onto our product fields. A person reviews every mapping before it is used. */
export interface Mapping {
  supplier: string;
  /** Every header the file is expected to have. A file with any other header set is a format change. */
  headers: string[];
  fields: {
    sku: { header: string };
    name: { header: string };
    /** `dollars` means a text amount such as `12.50` or `$3`. It becomes whole cents. */
    price: { header: string; format: 'dollars' };
  };
}

export interface ImportedProduct {
  sku: string;
  name: string;
  priceCents: Cents;
}

export interface RejectedRow {
  /** Row number in the file. The header is row 1. */
  row: number;
  reason: string;
}

export type FormatCheck = { status: 'ok' } | { status: 'format_changed'; added: string[]; removed: string[] };

export interface ImportResult {
  products: ImportedProduct[];
  rejected: RejectedRow[];
}
