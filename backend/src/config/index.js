// src/config/index.js — Central validated config with env separation
// Railway injects env vars directly — no dotenv needed in production
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const required = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`[CONFIG] Missing required env variable: ${key}`);
  return val;
};

const env = process.env.NODE_ENV || 'development';

module.exports = {
  env,
  isProd:  env === 'production',
  isDev:   env === 'development',
  isTest:  env === 'test',

  port:    parseInt(process.env.PORT) || 3001,

  db: {
    url: required('DATABASE_URL'),
  },

  jwt: {
    secret:              required('JWT_SECRET'),
    accessExpiresIn:     process.env.JWT_ACCESS_EXPIRES  || '1h',
    refreshExpiresIn:    process.env.JWT_REFRESH_EXPIRES || '30d',
    refreshSecret:       process.env.JWT_REFRESH_SECRET  || required('JWT_SECRET') + '_refresh',
  },

 cors: {
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
    : true,
},

  rateLimits: {
    login:  { windowMs: 15 * 60 * 1000, max: parseInt(process.env.LOGIN_RATE_MAX) || 10 },
    global: { windowMs: 15 * 60 * 1000, max: parseInt(process.env.GLOBAL_RATE_MAX) || 300 },
  },

  cookie: {
    secure:   env === 'production',
    sameSite: env === 'production' ? 'strict' : 'lax',
    maxAge:   30 * 24 * 60 * 60 * 1000, // 30 days
  },
};
