import { createHmac } from 'node:crypto';

/**
 * Signs a request to another Crumb & Co. service. The convention is in ../../docs/auth.md.
 * orders-api checks the same thing in its own `src/lib/auth.ts`. Each project keeps its own copy
 * so they can be built and shipped alone; the shared test vector in both test files keeps them in step.
 */
export const CALLER_HEADER = 'x-crumb-caller';
export const TIMESTAMP_HEADER = 'x-crumb-timestamp';
export const SIGNATURE_HEADER = 'x-crumb-signature';

export function signRequest(input: { method: string; path: string; timestamp: string; body: string; secret: string }): string {
  const text = `${input.method.toUpperCase()}\n${input.path}\n${input.timestamp}\n${input.body}`;
  return createHmac('sha256', input.secret).update(text).digest('hex');
}

/** The three headers to send with a request. */
export function signedHeaders(input: { caller: string; method: string; path: string; body?: string; secret: string; now: Date }): Record<string, string> {
  const timestamp = String(input.now.getTime());
  return {
    [CALLER_HEADER]: input.caller,
    [TIMESTAMP_HEADER]: timestamp,
    [SIGNATURE_HEADER]: signRequest({ method: input.method, path: input.path, timestamp, body: input.body ?? '', secret: input.secret }),
  };
}
