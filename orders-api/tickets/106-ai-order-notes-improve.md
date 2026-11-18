# 106: Order notes miss some allergies

Kitchen staff found that some notes with allergy information were read as "no allergies".
For example "She is lactose intolerant, so no cream please" shows no dairy warning on the bake list.

## Acceptance criteria

- Notes that mention an intolerance or allergy in common wordings are caught, including lactose and dairy wording.
- Notes that mention a food without a warning ("my husband loves almonds") do **not** raise a false allergy.
- The change is checked with the evals: run `npm run eval` **before** and **after**, and put both results in the PR.
- Add an eval case for every new wording you fix.
- Order totals and statuses are not touched. The model still only reads notes.

## Notes

- Read `docs/order-notes-ai.md` first. The keyword rules are in `src/services/order-notes/fallback.ts` and, for the offline fake model, `src/lib/ai/model.ts`. With a real model the equivalent change is the system prompt in `order-notes.ts`.
- Use a loop: change, run the eval, look at what still fails, repeat. Set a goal and a hard limit first (for example: all eval cases pass, or 4 rounds).
