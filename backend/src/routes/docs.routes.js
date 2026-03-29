'use strict';
const router = require('express').Router();
const config = require('../config');
const { baseSpec } = require('../docs/openapi');
const { protect, adminOnly } = require('../middleware/auth.middleware');

function resolveServerUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${proto}://${host}`;
}

function docsGuard(req, res, next) {
  if (!config.docs.enabled) {
    return res.status(404).json({ success: false, message: 'API docs disabled' });
  }
  return next();
}

const enforceAuthInProd = config.isProd && !config.docs.public
  ? [protect, adminOnly]
  : [];

router.use(docsGuard);

router.get('/openapi.json', ...enforceAuthInProd, (req, res) => {
  const spec = baseSpec(resolveServerUrl(req));
  res.setHeader('Cache-Control', 'no-cache');
  res.json(spec);
});

router.get('/', ...enforceAuthInProd, (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sea Hawk API Docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background: #f8fafc; }
    .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: '/api/docs/openapi.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      displayRequestDuration: true,
      persistAuthorization: true,
      tryItOutEnabled: true
    });
  </script>
</body>
</html>`);
});

module.exports = router;
