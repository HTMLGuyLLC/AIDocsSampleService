import type { NoteFields } from './types.ts';

const MAX_ALLERGIES = 10;
const MAX_TEXT = 60;

const isShortText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= MAX_TEXT;

/**
 * Checks the model's answer by hand. Returns the fields, or `null` if anything is off:
 * not JSON, not an object, extra or missing keys, wrong types, too long. No repairing, no guessing.
 */
export function parseModelAnswer(text: string): NoteFields | null {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const keys = Object.keys(value).sort().join(',');
  if (keys !== 'allergies,occasion,pickupAt') return null;

  const { allergies, pickupAt, occasion } = value as Record<string, unknown>;
  if (!Array.isArray(allergies) || allergies.length > MAX_ALLERGIES || !allergies.every(isShortText)) return null;
  if (pickupAt !== null && !isShortText(pickupAt)) return null;
  if (occasion !== null && !isShortText(occasion)) return null;

  return { allergies: allergies.map((a) => a.trim().toLowerCase()), pickupAt, occasion };
}
