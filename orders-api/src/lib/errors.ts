/**
 * Errors that map to an HTTP response. Throw these from services;
 * the router turns them into `{ error: { code, message } }` with the right status.
 * Anything else becomes a 500 and its message is not shown to the caller.
 */
export class AppError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (message: string) => new AppError(400, 'bad_request', message);
export const notFound = (what: string) => new AppError(404, 'not_found', `${what} not found`);
export const conflict = (message: string) => new AppError(409, 'conflict', message);
export const unauthorized = (message: string) => new AppError(401, 'unauthorized', message);
export const tooManyRequests = (code: string, message: string) => new AppError(429, code, message);
export const unavailable = (code: string, message: string) => new AppError(503, code, message);
