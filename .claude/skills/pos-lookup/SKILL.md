---
name: pos-lookup
description: Look up an order in the point-of-sale system by order number. Also looks up a day's sales or an item's price and stock. Use when asked about a POS order, what sold today, how much of an item sold, or the POS price or stock of a sku.
---

# POS lookup

The POS has no MCP connector, so this skill wraps its HTTP API in one small script. This is the pattern for
any tool without a connector: a script that does one job, a skill that says when and how to run it.

## Run it

```bash
node .claude/skills/pos-lookup/scripts/pos-lookup.mjs sales 2026-11-16   # sales summary for a day (default: today)
node .claude/skills/pos-lookup/scripts/pos-lookup.mjs item SOUR-LOAF     # price and stock for a sku
node .claude/skills/pos-lookup/scripts/pos-lookup.mjs order 1042         # one order: status, lines, total
node .claude/skills/pos-lookup/scripts/pos-lookup.mjs --fake sales       # canned data, no network, no key
```

It prints one line of JSON, money in cents. Read that. Don't ask for the raw API response.

## Rules

- The script reads `POS_API_URL` and `POS_API_KEY` from the environment. **Never read `.env`, never print or log the key.**
  If they are missing, load them with `scripts/load-secrets.sh` (see `docs/secrets.md`), or ask a person.
- It is read-only. Don't add a script that changes POS data without a person's approval.
- Use `--fake` when you only need to see the output shape or test code that uses it.
- If the POS answers with an error, report the status code. Don't retry in a loop.

## Why a script and not "just call the API"

One command is one tool call, the output is short (saves tokens), and the key stays in the environment
instead of in the conversation.
