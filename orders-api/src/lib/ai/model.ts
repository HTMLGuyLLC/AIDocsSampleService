/**
 * The only door to a language model. Everything else in the service talks to a `ModelClient`.
 *
 * No SDK here on purpose (docs/decisions/0001). To use a real model, write a small client that
 * calls your provider's HTTP API and returns the same shape, then return it from `createDefaultModel`.
 * The key comes from the vault (../../../../docs/secrets.md), never from code.
 */
export interface ModelRequest {
  model: string;
  system: string;
  prompt: string;
  maxTokens: number;
}

export interface ModelResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
  /** Input tokens that were served from the provider's prompt cache. Billed at a lower price. */
  cacheReadTokens: number;
}

export interface ModelClient {
  complete(req: ModelRequest): Promise<ModelResponse>;
}

const tokensIn = (text: string) => Math.ceil(text.length / 4);

const ALLERGENS: [RegExp, string][] = [
  [/\bpeanuts?\b/, 'peanuts'],
  [/\b(tree )?nuts?\b/, 'nuts'],
  [/\b(dairy|milk)\b/, 'dairy'],
  [/\bgluten\b/, 'gluten'],
  [/\beggs?\b/, 'egg'],
  [/\bsesame\b/, 'sesame'],
  [/\bsoy\b/, 'soy'],
  [/\bshellfish\b/, 'shellfish'],
];
const ALLERGY_CUES = /\b(no|free|allerg\w*|without|avoid|cannot|can't)\b/;
const DAY_TIME = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b(?:\s+at)?\s+(\d{1,2}(?::\d{2})?)\s?(am|pm)\b/;
const OCCASIONS = ['birthday', 'anniversary', 'wedding', 'retirement', 'graduation', 'party'];

/** Pulls the customer's note out of the wrapped prompt. Falls back to the whole prompt. */
function noteFrom(prompt: string): string {
  return /<user_data name="[^"]*">\n([\s\S]*?)\n<\/user_data>/.exec(prompt)?.[1] ?? prompt;
}

const MAPPING_LABEL = 'supplier_csv_sample';

/** Splits one CSV line. Quotes are honored. Only used to read the header row for the fake. */
function csvCells(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if (ch === ',' && !quoted) {
      cells.push(cell.trim());
      cell = '';
    } else cell += ch;
  }
  cells.push(cell.trim());
  return cells;
}

/** Maps supplier CSV headers to our fields by simple name matching. */
function fakeMapping(prompt: string): string {
  const sample = new RegExp(`<user_data name="${MAPPING_LABEL}">\\n([\\s\\S]*?)\\n</user_data>`).exec(prompt)?.[1] ?? '';
  const headers = csvCells(sample.split('\n')[0] ?? '');
  const used = new Set<string>();
  const pick = (pattern: RegExp): string | null => {
    const found = headers.find((h) => !used.has(h) && pattern.test(h.toLowerCase())) ?? null;
    if (found) used.add(found);
    return found;
  };
  return JSON.stringify({
    sku: pick(/sku|code|item\s*(no|number|id)|part/),
    name: pick(/name|desc|title|product/),
    price: pick(/price|cost|amount/),
    priceFormat: 'dollars',
  });
}

/** Simple keyword rules that stand in for a model. Only good enough to make the sample run offline. */
function fakeAnswer(prompt: string): string {
  if (prompt.includes(`<user_data name="${MAPPING_LABEL}">`)) return fakeMapping(prompt);
  const note = noteFrom(prompt).toLowerCase();
  const allergies = new Set<string>();
  for (const clause of note.split(/[,.;!]/)) {
    if (!ALLERGY_CUES.test(clause)) continue;
    for (const [pattern, name] of ALLERGENS) if (pattern.test(clause)) allergies.add(name);
  }
  const when = DAY_TIME.exec(note);
  const occasion = OCCASIONS.find((word) => note.includes(word)) ?? null;
  return JSON.stringify({
    allergies: [...allergies],
    pickupAt: when ? `${when[1]} ${when[2]}${when[3]}` : null,
    occasion,
  });
}

/** Runs offline with keyword rules. `calls` records every request so tests can count them. */
export function createFakeModel(): ModelClient & { calls: ModelRequest[] } {
  const calls: ModelRequest[] = [];
  let lastSystem = '';
  return {
    calls,
    async complete(req) {
      calls.push(req);
      const text = fakeAnswer(req.prompt);
      // Pretend the provider caches a system prompt it has just seen.
      const cached = req.system === lastSystem ? tokensIn(req.system) : 0;
      lastSystem = req.system;
      return {
        text,
        inputTokens: tokensIn(req.system) + tokensIn(req.prompt) - cached,
        outputTokens: tokensIn(text),
        cacheReadTokens: cached,
      };
    },
  };
}

/**
 * The model a feature uses. Returns the fake unless you plug in a real client here.
 * `keyName` is the environment variable that holds THIS feature's API key (e.g. `ORDER_NOTES_AI_KEY`).
 * One key per feature, so each can be cut off or have its spend read on its own. The fake ignores it.
 * A real client reads `process.env[keyName]` here and never accepts a key from anywhere else.
 */
export function createDefaultModel(keyName: string): ModelClient {
  void keyName;
  return createFakeModel();
}
