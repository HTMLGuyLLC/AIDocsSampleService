import type { Guard } from '../../lib/ai/guard.ts';
import type { ModelClient } from '../../lib/ai/model.ts';
import { UNTRUSTED_RULE, wrapUntrusted } from '../../lib/ai/untrusted.ts';
import type { UsageLedger } from '../../lib/ai/usage.ts';
import { log as defaultLog, type Logger } from '../../lib/log.ts';
import { parseNoteFallback } from './fallback.ts';
import type { NoteDetails } from './types.ts';
import { parseModelAnswer } from './validate.ts';

export const FEATURE = 'order-notes';
export const MAX_NOTE_LENGTH = 500;
const MAX_OUTPUT_TOKENS = 200;

/** Same text every call, so a real provider can cache it. The customer's note goes in the prompt, not here. */
export const SYSTEM_PROMPT = [
  'You read a short note a customer left on a bakery order.',
  'Reply with JSON only, in exactly this shape:',
  '{"allergies": string[], "pickupAt": string | null, "occasion": string | null}',
  'allergies: lower-case allergen names the customer wants avoided. pickupAt: the day and time they gave, or null. occasion: one word, or null.',
  'Never invent anything the note does not say.',
  UNTRUSTED_RULE,
].join('\n');

interface Deps {
  model: ModelClient;
  guard: Guard;
  usage: UsageLedger;
  /** Which model name to ask for and to price. */
  modelName?: string;
  timeoutMs?: number;
  log?: Logger;
}

class TimeoutError extends Error {}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError('Model call timed out')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Reads a customer's free-text note. The model only fills in kitchen information.
 * It never sees prices and its answer never touches a price, total, discount or status.
 * Why: orders-api/docs/decisions/0003-ai-only-for-order-notes.md
 */
export function createOrderNotes({ model, guard, usage, modelName = 'small-model', timeoutMs = 5000, log = defaultLog }: Deps) {
  return {
    async parseNote(note: string, context: { orderId?: string; requestId?: string } = {}): Promise<NoteDetails> {
      const fallback = (reason: string): NoteDetails => {
        log('warn', 'order note parsed by fallback', { ...context, reason });
        return { ...parseNoteFallback(note), source: 'fallback' };
      };

      const prompt = `Customer note:\n${wrapUntrusted('order_note', note)}`;
      const estimate = usage.cost(modelName, {
        inputTokens: Math.ceil((SYSTEM_PROMPT.length + prompt.length) / 4),
        outputTokens: MAX_OUTPUT_TOKENS,
        cacheReadTokens: 0,
      }).costMicros;

      let reservation;
      try {
        reservation = guard.reserve(estimate);
      } catch (err) {
        return fallback(err instanceof Error ? err.message : 'blocked');
      }

      let answer;
      try {
        answer = await withTimeout(model.complete({ model: modelName, system: SYSTEM_PROMPT, prompt, maxTokens: MAX_OUTPUT_TOKENS }), timeoutMs);
      } catch (err) {
        // The reservation is kept on purpose: a call that failed may still have been billed.
        return fallback(err instanceof TimeoutError ? 'model timed out' : 'model call failed');
      }

      const row = usage.record({ model: modelName, feature: FEATURE, ...answer });
      guard.settle(reservation, row.costMicros);

      const fields = parseModelAnswer(answer.text);
      if (!fields) return fallback('model answer was not valid');
      return { ...fields, source: 'ai' };
    },
  };
}

export type OrderNotes = ReturnType<typeof createOrderNotes>;
