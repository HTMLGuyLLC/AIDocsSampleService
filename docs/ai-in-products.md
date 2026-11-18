# AI or normal code inside a product?

Using AI to *build* software is one thing. This doc is about putting a model *inside* a feature customers use.
The question is always: **does this step need judgment about messy input, or is it a rule?**

## Use normal (deterministic) code when there is a right answer

Prices, totals, discounts, taxes, statuses, permissions, anything that moves money.
Same input, same output, every time, and you can test it. A model can be wrong in a way that looks right.
Our rule: **the model never decides money, status or access.** Example: [orders-api decision 0003](../orders-api/docs/decisions/0003-ai-only-for-order-notes.md).

## Use a language model (LLM) for messy human input

- Free-text order notes ("no nuts please, pickup Saturday 9am, it's for a birthday")
- Sorting a pile of customer emails (complaint, question, order change)
- Mapping the messy columns of a supplier spreadsheet to our fields

Rules there are too many or too fuzzy to write by hand.

## Option 3: use AI to write the code, once

Sometimes the input is messy but the **job repeats the same way**. Don't call a model for every row. Ask an agent to write a normal
function or script for it, test it on real examples, and run that. You pay for the AI once, and then it is fast, free and predictable.
Example: a one-off converter for a supplier's spreadsheet format.

## The middle ground

- **Decision tables.** A table of "if A and B, then C". Easy to read, easy to test, and a person can edit it.
- **Classic machine learning.** A small trained classifier for a task with lots of past labeled examples.
- **Small language models (SLMs).** A small model you can run cheaply or on your own machine. A good fit for **high-volume, low-cost, or private** classification, such as tagging every incoming email, when you don't want to send data to a big outside model.

## Always

- **Validate the model's output** like any other untrusted input: right shape, right types, sensible limits. Reject anything else.
- **Have a deterministic fallback.** If the model is down, too slow, over budget or wrong, the feature still works in a simpler way.
  The order-notes feature falls back to a keyword parser and says so (`source: 'fallback'`).
- **Record the cost and keep a kill switch.** See [ai-safety-and-cost.md](ai-safety-and-cost.md).
- **Test with real examples before you change a prompt or model** (evals).

## Quick check

| If... | Then |
|---|---|
| There is one right answer you can write as a rule | Normal code |
| The input is messy text, and a wrong answer is cheap to fix | A model, with validation and a fallback |
| The input is messy but the job repeats the same way | Have AI write the code once |
| High volume, simple labels, or private data | A decision table, classic ML, or a small model |
| A wrong answer costs money or trust | Normal code, or a model that only *proposes* and a person confirms |
