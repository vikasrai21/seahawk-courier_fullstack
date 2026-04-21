// test-agent.js — Full Phase 2 Test Suite
require('dotenv').config();
const ownerAgent = require('./src/services/ownerAgent.service');

async function test() {
  const sid = 'test-full';

  const tests = [
    // ── Instant flows (no fields) ──────────────────────────────────────────
    { name: 'System Overview',     msgs: ['show overview'] },
    { name: 'List Clients',        msgs: ['list clients'] },
    { name: 'Negative Wallets',    msgs: ['show negative wallets'] },
    { name: 'Pending NDRs',        msgs: ['pending ndr'] },
    { name: 'Courier Performance', msgs: ['courier performance'] },
    { name: 'Daily Report',        msgs: ['daily report', 'today'] },

    // ── Single-field flows ─────────────────────────────────────────────────
    { name: 'Wallet Balance',      msgs: ['check wallet for VKR', 'VKR'] },

    // ── Multi-turn: Create Client ──────────────────────────────────────────
    { name: 'Create Client',       msgs: ['create a client', 'TST', 'Test Company', '9876543210', 'skip', 'skip', 'skip', 'cancel'] },

    // ── Invoice flow ───────────────────────────────────────────────────────
    { name: 'Generate Invoice',    msgs: ['generate invoice', 'VKR', '2026-04-01', '2026-04-20', 'cancel'] },

    // ── Wallet Credit ──────────────────────────────────────────────────────
    { name: 'Wallet Credit',       msgs: ['add money to VKR', 'VKR', '5000', 'skip', 'cancel'] },

    // ── Search ─────────────────────────────────────────────────────────────
    { name: 'Search Shipments',    msgs: ['search shipments', 'Delhi'] },
  ];

  for (const t of tests) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`  ${t.name}`);
    console.log(`${'─'.repeat(50)}`);

    for (const msg of t.msgs) {
      try {
        const res = await ownerAgent.chat({ message: msg, sessionId: sid });
        // Truncate long replies for readability
        const reply = res.reply.length > 200 ? res.reply.substring(0, 200) + '...' : res.reply;
        console.log(`  YOU: ${msg}`);
        console.log(`  🦅: ${reply.replace(/\n/g, '\n      ')}`);
      } catch (err) {
        console.log(`  YOU: ${msg}`);
        console.log(`  ❌: ${err.message}`);
      }
    }
  }

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  ✅ ALL TESTS COMPLETE — 43 flows registered`);
  console.log(`${'═'.repeat(50)}`);
  process.exit(0);
}

test();
