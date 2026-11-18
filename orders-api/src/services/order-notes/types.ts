/** What we pull out of a customer's free-text note. It is only ever used for kitchen information. */
export interface NoteFields {
  /** Lower-case allergen names, e.g. `nuts`, `dairy`. */
  allergies: string[];
  /** When the customer wants to collect it, as they said it, e.g. `saturday 9am`. Not a checked date. */
  pickupAt: string | null;
  occasion: string | null;
}

export interface NoteDetails extends NoteFields {
  /** `ai` when the model's answer passed validation. `fallback` when the keyword parser answered instead. */
  source: 'ai' | 'fallback';
}
