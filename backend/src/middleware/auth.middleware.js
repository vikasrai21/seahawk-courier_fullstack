// src/middleware/auth.middleware.js
const jwt    = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const R      = require('../utils/response');

const protect = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }
    if (!token) return R.unauthorized(res, 'Authentication required.');
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, branch: true, phone: true, active: true },
    });
    if (!user)        return R.unauthorized(res, 'User no longer exists.');
    if (!user.active) return R.unauthorized(res, 'Account is deactivated. Contact admin.');
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

// Accepts both: requireRole('A','B') and requireRole(['A','B'])
const requireRole = (...args) => (req, res, next) => {
  if (!req.user) return R.unauthorized(res);
  const allowed = Array.isArray(args[0]) ? args[0] : args;
  if (!allowed.includes(req.user.role)) {
    return R.forbidden(res, `Access denied. Required: ${allowed.join(' or ')}`);
  }
  next();
};

const adminOnly    = requireRole('ADMIN');
const staffOrAdmin = requireRole('STAFF', 'ADMIN');

// Alias used by new v7 routes
module.exports = {
  protect,
  authenticate: protect,   // alias
  requireRole,
  adminOnly,
  staffOrAdmin,
};
