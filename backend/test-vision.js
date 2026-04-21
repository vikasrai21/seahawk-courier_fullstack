require('dotenv').config({path: './.env'});
const axios = require('axios');

async function test() {
  const key = process.env.GOOGLE_VISION_API_KEY;
  if (!key) {
    console.log('NO KEY FOUND IN .ENV');
    return;
  }
  console.log('Key found:', key.substring(0, 6) + '...' + key.substring(key.length - 4));
  
  try {
    const res = await axios.post(`https://vision.googleapis.com/v1/images:annotate?key=${key}`, {
      requests: [{
        image: { content: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=' }, 
        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }]
      }]
    });
    console.log('VISION RESPONSE OK:', res.data.responses.length > 0 ? 'Success!' : 'No response');
  } catch(e) {
    console.error('VISION ERROR:', e.response ? e.response.data.error : e.message);
  }
}
test();
