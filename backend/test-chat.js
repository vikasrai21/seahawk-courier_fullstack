const ownerAgent = require('./src/services/ownerAgent.service');

async function main() {
  try {
    const res = await ownerAgent.chat({ message: 'Hey HawkAI! How many active shipments do we have compared to our NDRs, and do you think we are doing okay? Explain it like a Pirate.', history: [] });
    console.log("SUCCESS:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("ERROR:", err.message);
    console.error(err.stack);
  }
}

main().finally(() => process.exit(0));
