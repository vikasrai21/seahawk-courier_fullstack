import { createRequire } from 'module';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const { ZodError, z } = require('zod');

const loggerMock = { error: vi.fn(), warn: vi.fn(), info: vi.fn() };
const configMock = { cookie: { secure: false, sameSite: 'lax' } };
const authServiceMock = { sanitise: vi.fn((value) => String(value).replace(/<[^>]*>/g, '').trim()) };

vi.mock('../../utils/logger', () => ({
  __esModule: true,
  default: loggerMock,
  ...loggerMock,
}));
vi.mock('../../config', () => ({
  __esModule: true,
  default: configMock,
  ...configMock,
}));
vi.mock('../../services/auth.service', () => ({
  __esModule: true,
  ...authServiceMock,
}));

import { validate } from '../../middleware/validate.middleware.js';
import { sanitiseBody } from '../../middleware/sanitise.middleware.js';
import { AppError, asyncHandler, globalErrorHandler } from '../../middleware/errorHandler.js';
import { generateToken, issueCsrfCookie, validateCsrf } from '../../middleware/csrf.middleware.js';

function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
  };
}

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validate middleware coerces parsed request data', () => {
    const schema = z.object({ amount: z.coerce.number() });
    const req = { body: { amount: '42' } };
    const res = createRes();
    const next = vi.fn();

    validate(schema)(req, res, next);

    expect(req.body.amount).toBe(42);
    expect(next).toHaveBeenCalledWith();
  });

  it('validate middleware returns formatted Zod errors', () => {
    const schema = z.object({ amount: z.string().regex(/^\d+$/) });
    const req = { body: { amount: 'bad' } };
    const res = createRes();
    const next = vi.fn();

    validate(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'Validation failed.' }));
    expect(next).not.toHaveBeenCalled();
  });

  it('sanitiseBody cleans nested strings but skips password-like fields', () => {
    const req = {
      body: {
        name: ' <b>John</b> ',
        nested: { note: ' <i>Hello</i> ' },
        password: '<secret>',
        token: '<token>',
      },
    };
    const next = vi.fn();

    sanitiseBody(req, {}, next);

    expect(req.body.name).toBe('John');
    expect(req.body.nested.note).toBe('Hello');
    expect(req.body.password).toBe('<secret>');
    expect(req.body.token).toBe('<token>');
    expect(next).toHaveBeenCalled();
  });

  it('issueCsrfCookie creates a client-readable token cookie when missing', () => {
    const req = { cookies: {} };
    const res = createRes();
    const next = vi.fn();

    issueCsrfCookie(req, res, next);

    expect(res.cookie).toHaveBeenCalledWith(
      'csrf_token',
      expect.any(String),
      expect.objectContaining({ httpOnly: false, sameSite: 'lax' }),
    );
    expect(next).toHaveBeenCalled();
  });

  it('validateCsrf skips safe and bearer-token requests and rejects mismatches', () => {
    const next = vi.fn();
    const safeReq = { method: 'GET', path: '/ops', headers: {}, cookies: {} };
    validateCsrf(safeReq, createRes(), next);
    expect(next).toHaveBeenCalled();

    const bearerReq = { method: 'POST', path: '/ops', headers: { authorization: 'Bearer abc' }, cookies: { refreshToken: 'r1' } };
    const bearerNext = vi.fn();
    validateCsrf(bearerReq, createRes(), bearerNext);
    expect(bearerNext).toHaveBeenCalled();

    const badReq = {
      method: 'POST',
      path: '/ops',
      ip: '127.0.0.1',
      headers: { 'x-csrf-token': 'bad' },
      cookies: { refreshToken: 'r1', csrf_token: 'good' },
    };
    const res = createRes();
    validateCsrf(badReq, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('validateCsrf accepts matching cookie and header tokens', () => {
    const token = generateToken();
    const req = {
      method: 'POST',
      path: '/ops',
      headers: { 'x-csrf-token': token },
      cookies: { refreshToken: 'r1', csrf_token: token },
    };
    const next = vi.fn();

    validateCsrf(req, createRes(), next);

    expect(next).toHaveBeenCalled();
  });

  it('asyncHandler forwards rejected promises', async () => {
    const next = vi.fn();
    const err = new Error('boom');
    const wrapped = asyncHandler(async () => {
      throw err;
    });

    await wrapped({}, {}, next);

    expect(next).toHaveBeenCalledWith(err);
  });

  it('globalErrorHandler formats operational, prisma, jwt, zod, and unknown errors', () => {
    const req = { method: 'POST', path: '/ops', ip: '127.0.0.1', user: { id: 1 } };

    const prismaRes = createRes();
    globalErrorHandler({ code: 'P2002', meta: { target: ['email'] }, message: 'dup' }, req, prismaRes);
    expect(prismaRes.status).toHaveBeenCalledWith(409);

    const opRes = createRes();
    globalErrorHandler(new AppError('Nope', 422), req, opRes);
    expect(opRes.status).toHaveBeenCalledWith(422);

    const jwtRes = createRes();
    globalErrorHandler({ name: 'JsonWebTokenError', message: 'bad token' }, req, jwtRes);
    expect(jwtRes.status).toHaveBeenCalledWith(401);

    const zodRes = createRes();
    const zodError = new ZodError([{ code: 'custom', path: ['email'], message: 'bad', fatal: false }]);
    globalErrorHandler(zodError, req, zodRes);
    expect(zodRes.status).toHaveBeenCalledWith(400);

    const unknownRes = createRes();
    globalErrorHandler(new Error('explode'), req, unknownRes);
    expect(unknownRes.status).toHaveBeenCalledWith(500);
  });
});
