require('dotenv').config({ path: '.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test(modelName) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const res = await model.generateContent("Test");
    console.log(`[SUCCESS] ${modelName} works. Output length: ${res.response.text().length}`);
  } catch (err) {
    if (err.message.includes('429')) {
      console.log(`[RATE_LIMITED] ${modelName}`);
    } else {
      console.error(`[FAIL] ${modelName}:`, err.message);
    }
  }
}

async function run() {
  await test('gemini-1.5-flash-8b');
  await test('gemini-1.0-pro');
}
run();
