require('dotenv').config({ path: '.env' });
const { fetchTracking } = require('./src/services/carrier.service.js');

async function test() {
  try {
    const res = await fetchTracking('Trackon', '200062288907', { bypassCache: true });
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error(err);
  }
}

test();
