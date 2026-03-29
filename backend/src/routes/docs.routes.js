'use strict';

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const swaggerUi = require('swagger-ui-express');
const config = require('../config');
const { protect, adminOnly } = require('../middleware/auth.middleware');

const router = require('express').Router();
const swaggerPath = path.join(__dirname, '../docs/swagger.yaml');

function docsGuard(req, res, next) {
  if (!config.docs.enabled) {
    return res.status(404).json({ success: false, message: 'API docs disabled' });
  }
  return next();
}

function loadSpec(req) {
  const source = fs.readFileSync(swaggerPath, 'utf8');
  const spec = YAML.parse(source);
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  spec.servers = [{ url: `${proto}://${host}`, description: 'Current environment' }];
  return spec;
}

const enforceAuthInProd = config.isProd && !config.docs.public
  ? [protect, adminOnly]
  : [];

router.use(docsGuard);

router.get('/openapi.json', ...enforceAuthInProd, (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.json(loadSpec(req));
});

router.use(
  '/',
  ...enforceAuthInProd,
  swaggerUi.serve,
  swaggerUi.setup(null, {
    swaggerOptions: {
      url: '/api/docs/openapi.json',
      deepLinking: true,
      displayRequestDuration: true,
      persistAuthorization: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'Sea Hawk API Docs',
  })
);

module.exports = router;
