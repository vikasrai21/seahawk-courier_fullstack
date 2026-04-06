const fs = require('fs');
let c = fs.readFileSync('backend/src/routes/rates.routes.js', 'utf8');

c = c.replace(
  "const R = require('../utils/response');",
  "const R = require('../utils/response');\nconst { validate } = require('../middleware/validate.middleware');\nconst { autoSuggestSchema, bulkCalculateSchema, verifySchema } = require('../validators/rates.validator');"
);

c = c.replace(/router\.post\('\/calculate\/bulk',\s*async/g, "router.post('/calculate/bulk', validate(bulkCalculateSchema), async");
c = c.replace(/router\.post\('\/verify',\s*ownerOnly,\s*async/g, "router.post('/verify', ownerOnly, validate(verifySchema), async");
c = c.replace(/router\.post\('\/auto-suggest',\s*async/g, "router.post('/auto-suggest', validate(autoSuggestSchema), async");

fs.writeFileSync('backend/src/routes/rates.routes.js', c);
console.log("Updated rates routes validation");
