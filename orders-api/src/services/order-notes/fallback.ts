import type { NoteFields } from './types.ts';

const ALLERGENS: [string, string][] = [
  ['peanut', 'peanuts'],
  ['nut', 'nuts'],
  ['dairy', 'dairy'],
  ['gluten', 'gluten'],
  ['egg', 'egg'],
  ['sesame', 'sesame'],
  ['soy', 'soy'],
  ['shellfish', 'shellfish'],
];
const OCCASIONS = ['birthday', 'anniversary', 'wedding', 'retirement', 'graduation', 'party'];
const DAY_TIME = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b(?:\s+at)?\s+(\d{1,2}(?::\d{2})?)\s?(am|pm)\b/;

/**
 * The plain keyword parser used whenever the model can't answer (bad output, timeout, budget, kill switch).
 * Deliberately simple and predictable. It may miss things the model would catch; it never invents them.
 */
export function parseNoteFallback(note: string): NoteFields {
  const text = note.toLowerCase();
  const allergies: string[] = [];
  for (const [word, name] of ALLERGENS) {
    const before = new RegExp(`\\b(no|without|allergic to|allergy to)\\b[^,.;!]*\\b${word}`);
    const after = new RegExp(`\\b${word}s?\\b[- ]*(free|allergy)`);
    if ((before.test(text) || after.test(text)) && !allergies.includes(name)) allergies.push(name);
  }
  const when = DAY_TIME.exec(text);
  return {
    allergies,
    pickupAt: when ? `${when[1]} ${when[2]}${when[3]}` : null,
    occasion: OCCASIONS.find((word) => text.includes(word)) ?? null,
  };
}
