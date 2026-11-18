/**
 * One JSON object per line, with the fields every Crumb & Co. service logs.
 * Rules: ../../../docs/logging.md
 */
export type Level = 'debug' | 'info' | 'warn' | 'error';

export interface Fields {
  requestId?: string;
  orderId?: string;
  [key: string]: unknown;
}

export type Logger = (level: Level, msg: string, fields?: Fields) => void;

const SERVICE = 'orders-api';

export const log: Logger = (level, msg, fields = {}) => {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    service: SERVICE,
    env: process.env.APP_ENV ?? 'dev',
    msg,
    ...fields,
  });
  if (level === 'error') console.error(line);
  else console.log(line);
};

/** A logger that does nothing. Tests pass this so output stays quiet. */
export const silentLog: Logger = () => {};

/**
 * Hides most of an email so it is safe to log: `sam+cakes@example.com` becomes `s***+cakes@example.com`.
 * Keeps the first letter and everything from the first `+` or `@`.
 */
export function maskEmail(email: string): string {
  const cut = email.search(/[+@]/);
  if (cut <= 0) return '***';
  return `${email[0]}***${email.slice(cut)}`;
}
