import { randomUUID } from 'node:crypto';
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';
import { AppError } from './errors.ts';
import { log } from './log.ts';

export interface Request {
  method: string;
  /** The path without the query string. Signed requests are signed over this. */
  path: string;
  params: Record<string, string>;
  /** The body, parsed as JSON. `undefined` when there is none. */
  body: unknown;
  /** The body exactly as it arrived. Signatures are checked against this, not the parsed body. */
  rawBody: string;
  headers: IncomingHttpHeaders;
  requestId: string;
}

export interface Response {
  status: number;
  body: unknown;
}

export type Handler = (req: Request) => Response | Promise<Response>;

export interface Route {
  method: 'GET' | 'POST';
  /** Path with `:name` placeholders, e.g. `/orders/:id/pay`. */
  path: string;
  handler: Handler;
}

const MAX_BODY_BYTES = 100_000;

function match(pattern: string, path: string): Record<string, string> | null {
  const want = pattern.split('/');
  const got = path.split('/');
  if (want.length !== got.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < want.length; i++) {
    const w = want[i] ?? '';
    const g = got[i] ?? '';
    if (w.startsWith(':')) params[w.slice(1)] = decodeURIComponent(g);
    else if (w !== g) return null;
  }
  return params;
}

async function readBody(req: IncomingMessage): Promise<string> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new AppError(413, 'too_large', 'Request body is too large');
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function parseJson(rawBody: string): unknown {
  if (rawBody === '') return undefined;
  try {
    return JSON.parse(rawBody);
  } catch {
    throw new AppError(400, 'bad_json', 'Request body is not valid JSON');
  }
}

function send(res: ServerResponse, { status, body }: Response): void {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

export function createRouter(routes: Route[]) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const path = new URL(req.url ?? '/', 'http://localhost').pathname;
    const requestId = randomUUID();
    try {
      for (const route of routes) {
        if (route.method !== req.method) continue;
        const params = match(route.path, path);
        if (!params) continue;
        const rawBody = await readBody(req);
        const body = parseJson(rawBody);
        send(res, await route.handler({ method: route.method, path, params, body, rawBody, headers: req.headers, requestId }));
        return;
      }
      send(res, { status: 404, body: { error: { code: 'not_found', message: 'No such route' } } });
    } catch (err) {
      if (err instanceof AppError) {
        send(res, { status: err.status, body: { error: { code: err.code, message: err.message } } });
        return;
      }
      log('error', 'unhandled error', { requestId, path, error: err instanceof Error ? err.message : String(err) });
      send(res, { status: 500, body: { error: { code: 'internal', message: 'Something went wrong' } } });
    }
  };
}
