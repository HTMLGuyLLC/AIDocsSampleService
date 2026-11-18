# Choosing a model

## The default

**Use Opus at low effort.** Switch up only when the task is hard (a design choice, a tricky bug, a security question).

## Hand off the simple work

Use a cheaper model as a **subagent** for work that is simple and mechanical, with a clear target:

| Work | Model |
|---|---|
| Planning, design, review, anything ambiguous | Opus |
| Carrying out a plan someone already wrote | Sonnet |
| Renames, formatting, boilerplate, lookups, one-file edits | Haiku |

Then **have Opus check what they did.** Delegating saves money only if the result is right. A quick review is cheaper than a bug.

## Why a stronger model on low effort is often cheaper

Rule of thumb: **a stronger model on low effort usually beats a weaker model on high effort.**

- A weaker model on high effort thinks longer, and still makes more mistakes and takes more retries.
- Every retry costs tokens, your time, and a review.
- A stronger model gets it right more often on the first pass, so there are fewer bugs and less rework.

So the cheapest option per task is not the cheapest price per token. It is the one that finishes correctly the first time.
Measure it on your own work if it matters: count retries, not just tokens.

## When unsure

If you can't decide between two models, the work probably needs the stronger one.

## For AI inside our products

Same idea, plus a price table and a budget: [ai-safety-and-cost.md](ai-safety-and-cost.md).
