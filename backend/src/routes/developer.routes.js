const express = require('express');
const router = express.Router();
const { auth, requireClientCode } = require('../middleware/auth.middleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
const R = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

router.use(auth);

// GET /api/portal/developer/keys
router.get('/keys', requireClientCode, asyncHandler(async (req, res) => {
  const keys = await prisma.clientApiKey.findMany({
    where: { clientCode: req.clientCode },
    orderBy: { createdAt: 'desc' }
  });
  
  // Omit the tokenHash from output
  const safeKeys = keys.map(k => {
    const { tokenHash, ...rest } = k;
    return rest;
  });
  
  R.ok(res, safeKeys);
}));

// POST /api/portal/developer/keys
router.post('/keys', requireClientCode, asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Key name is required' });

  // Check limit (max 5 keys per client)
  const count = await prisma.clientApiKey.count({ where: { clientCode: req.clientCode, active: true } });
  if (count >= 5) {
    return res.status(403).json({ success: false, message: 'Maximum 5 active API keys allowed.' });
  }

  const rawToken = 'shk_live_' + crypto.randomBytes(24).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const key = await prisma.clientApiKey.create({
    data: {
      clientCode: req.clientCode,
      name,
      tokenHash,
    }
  });

  // Notice we return the rawToken ONLY ONCE during creation!
  res.json({
    success: true,
    data: {
      id: key.id,
      name: key.name,
      createdAt: key.createdAt,
      active: key.active,
      token: rawToken // THE ONLY TIME THEY SEE THIS
    }
  });
}));

// DELETE /api/portal/developer/keys/:id
router.delete('/keys/:id', requireClientCode, asyncHandler(async (req, res) => {
  await prisma.clientApiKey.deleteMany({
    where: { 
      id: parseInt(req.params.id),
      clientCode: req.clientCode 
    }
  });
  R.ok(res, null, 'API key revoked');
}));

module.exports = router;
