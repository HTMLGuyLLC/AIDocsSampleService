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

/** Simple keyword rules that stand in for a model. Only good enough to make the sample run offline. */
function fakeAnswer(prompt: string): string {
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

/** The model the app and the evals use. Returns the fake unless you plug in a real client here. */
export function createDefaultModel(): ModelClient {
  return createFakeModel();
}
