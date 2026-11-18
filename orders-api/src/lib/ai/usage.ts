/**
 * The usage ledger: one row per model call, with the cost frozen at call time.
 * Money here is in micros of a dollar (1_000_000 = $1), so it stays whole numbers.
 * Why we record every call: ../../../../docs/ai-safety-and-cost.md
 */
export interface Price {
  inputMicrosPerMillion: number;
  outputMicrosPerMillion: number;
  cacheReadMicrosPerMillion: number;
}

export type PriceTable = Record<string, Price>;

/** Made-up prices for the sample. Copy your provider's real prices into your own table. */
export const defaultPrices: PriceTable = {
  'small-model': { inputMicrosPerMillion: 1_000_000, outputMicrosPerMillion: 5_000_000, cacheReadMicrosPerMillion: 100_000 },
  'large-model': { inputMicrosPerMillion: 5_000_000, outputMicrosPerMillion: 25_000_000, cacheReadMicrosPerMillion: 500_000 },
};

/** Used for a model that isn't in the table. Deliberately high, so a missing entry is noticed, not free. */
export const fallbackPrice: Price = {
  inputMicrosPerMillion: 10_000_000,
  outputMicrosPerMillion: 50_000_000,
  cacheReadMicrosPerMillion: 1_000_000,
};

export interface Tokens {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
}

export interface UsageRow extends Tokens {
  id: number;
  at: string;
  model: string;
  feature: string;
  costMicros: number;
  /** `fallback` means the model wasn't in the price table. */
  priceSource: 'table' | 'fallback';
}

export interface Totals extends Tokens {
  calls: number;
  costMicros: number;
}

export interface UsageSummary extends Totals {
  byFeature: Record<string, Totals>;
  byModel: Record<string, Totals>;
}

const emptyTotals = (): Totals => ({ calls: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, costMicros: 0 });

function add(totals: Totals, row: UsageRow): void {
  totals.calls += 1;
  totals.inputTokens += row.inputTokens;
  totals.outputTokens += row.outputTokens;
  totals.cacheReadTokens += row.cacheReadTokens;
  totals.costMicros += row.costMicros;
}

export function createUsageLedger({ prices = defaultPrices, now = () => new Date() }: { prices?: PriceTable; now?: () => Date } = {}) {
  let table: PriceTable = { ...prices };
  const rows: UsageRow[] = [];

  const priceFor = (model: string) => (Object.hasOwn(table, model) ? { price: table[model] as Price, source: 'table' as const } : { price: fallbackPrice, source: 'fallback' as const });

  /** What these tokens cost at today's prices. Rounds up to a whole micro. */
  function cost(model: string, tokens: Tokens): { costMicros: number; priceSource: 'table' | 'fallback' } {
    const { price, source } = priceFor(model);
    const micros =
      (tokens.inputTokens * price.inputMicrosPerMillion +
        tokens.outputTokens * price.outputMicrosPerMillion +
        tokens.cacheReadTokens * price.cacheReadMicrosPerMillion) /
      1_000_000;
    return { costMicros: Math.ceil(micros), priceSource: source };
  }

  return {
    cost,

    /** Replace the price table. Rows already recorded keep the cost they were given. */
    setPrices(next: PriceTable): void {
      table = { ...next };
    },

    /** Stores one call. The cost is worked out now, from the current table, and never recomputed. */
    record(call: { model: string; feature: string } & Tokens): UsageRow {
      const { costMicros, priceSource } = cost(call.model, call);
      const row: UsageRow = {
        id: rows.length + 1,
        at: now().toISOString(),
        model: call.model,
        feature: call.feature,
        inputTokens: call.inputTokens,
        outputTokens: call.outputTokens,
        cacheReadTokens: call.cacheReadTokens,
        costMicros,
        priceSource,
      };
      rows.push(row);
      return { ...row };
    },

    rows(): UsageRow[] {
      return rows.map((row) => ({ ...row }));
    },

    /** Totals by feature and by model. This is what a dashboard shows. */
    summary(): UsageSummary {
      const total = emptyTotals();
      const byFeature: Record<string, Totals> = Object.create(null);
      const byModel: Record<string, Totals> = Object.create(null);
      for (const row of rows) {
        add(total, row);
        add((byFeature[row.feature] ??= emptyTotals()), row);
        add((byModel[row.model] ??= emptyTotals()), row);
      }
      return { ...total, byFeature: { ...byFeature }, byModel: { ...byModel } };
    },
  };
}

export type UsageLedger = ReturnType<typeof createUsageLedger>;
