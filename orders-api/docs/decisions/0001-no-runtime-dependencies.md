# 0001: No runtime dependencies

Status: accepted

## Decision

The service uses only Node's built-in modules at runtime. TypeScript and Node's types are the only dev dependencies.

## Why

- Node now runs TypeScript, serves HTTP, runs tests and has `fetch` built in. For a service this size, packages add more risk than they save.
- Fewer packages means fewer security updates and less for a reviewer (or an agent) to learn.

## What this means

- Ask before adding any package. If one is worth it, write a new decision that replaces this one.
- Prefer a small, tested helper in `src/lib/` over a package for a single function.
