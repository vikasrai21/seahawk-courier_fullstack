import { createRequire } from 'module';
import { describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const response = require('../../utils/response.js');

function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe('response utils', () => {
  it('formats success responses consistently', () => {
    const res = createRes();
    response.ok(res, { ok: true }, 'Done', 202);
    response.created(res, { id: 1 }, 'Created');
    response.paginated(res, [{ id: 1 }], 11, 2, 5);

    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenNthCalledWith(1, {
      success: true,
      message: 'Done',
      data: { ok: true },
    });
    expect(res.json).toHaveBeenNthCalledWith(2, {
      success: true,
      message: 'Created',
      data: { id: 1 },
    });
    expect(res.json).toHaveBeenNthCalledWith(3, {
      success: true,
      message: 'Success',
      data: [{ id: 1 }],
      pagination: { total: 11, page: 2, limit: 5, pages: 3 },
    });
  });

  it('formats error helpers consistently', () => {
    const res = createRes();
    response.error(res, 'Bad', 418, [{ field: 'x' }]);
    response.badRequest(res);
    response.notFound(res, 'Shipment');
    response.forbidden(res);
    response.unauthorized(res);
    response.conflict(res, 'Duplicate');

    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenNthCalledWith(1, {
      success: false,
      message: 'Bad',
      errors: [{ field: 'x' }],
    });
    expect(res.json).toHaveBeenNthCalledWith(2, {
      success: false,
      message: 'Bad request',
    });
    expect(res.json).toHaveBeenNthCalledWith(3, {
      success: false,
      message: 'Shipment not found',
    });
    expect(res.json).toHaveBeenNthCalledWith(4, {
      success: false,
      message: 'Access denied',
    });
    expect(res.json).toHaveBeenNthCalledWith(5, {
      success: false,
      message: 'Unauthorized',
    });
    expect(res.json).toHaveBeenNthCalledWith(6, {
      success: false,
      message: 'Duplicate',
    });
  });
});
