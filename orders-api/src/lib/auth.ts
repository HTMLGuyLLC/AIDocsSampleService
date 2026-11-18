import { createHmac, timingSafeEqual } from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';
import { unauthorized } from './errors.ts';

/**
 * Service-to-service auth. The convention is in ../../../docs/auth.md.
 * A caller signs `METHOD \n path \n timestamp \n body` with its own secret and sends three headers.
 */
export const CALLER_HEADER = 'x-crumb-caller';
export const TIMESTAMP_HEADER = 'x-crumb-timestamp';
export const SIGNATURE_HEADER = 'x-crumb-signature';
export const MAX_SKEW_MS = 5 * 60 * 1000;

export function signRequest(input: { method: string; path: string; timestamp: string; body: string; secret: string }): string {
  const text = `${input.method.toUpperCase()}\n${input.path}\n${input.timestamp}\n${input.body}`;
  return createHmac('sha256', input.secret).update(text).digest('hex');
}

const first = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);

/** Throws 401 unless the request is signed by a known caller and is recent. Returns the caller's name. */
export function verifySignature(input: {
  method: string;
  path: string;
  rawBody: string;
  headers: IncomingHttpHeaders;
  /** Caller name → shared secret. Secrets come from the vault: docs/secrets.md. */
  secrets: Readonly<Record<string, string>>;
  now: Date;
}): string {
  const caller = first(input.headers[CALLER_HEADER]);
  const timestamp = first(input.headers[TIMESTAMP_HEADER]);
  const signature = first(input.headers[SIGNATURE_HEADER]);
  if (!caller || !timestamp || !signature) throw unauthorized('Missing signature headers');

  const secret = Object.hasOwn(input.secrets, caller) ? input.secrets[caller] : undefined;
  if (!secret) throw unauthorized('Unknown caller');

  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt) || Math.abs(input.now.getTime() - sentAt) > MAX_SKEW_MS) {
    throw unauthorized('Timestamp is too old or too new');
  }

  const expected = Buffer.from(signRequest({ method: input.method, path: input.path, timestamp, body: input.rawBody, secret }));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw unauthorized('Bad signature');
  return caller;
}
