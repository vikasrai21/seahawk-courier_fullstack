import { describe, expect, it, vi } from 'vitest';
import * as response from '../../utils/response.js';

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
  });
});
