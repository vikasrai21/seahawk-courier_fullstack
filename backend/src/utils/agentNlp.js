'use strict';

const { NlpManager } = require('node-nlp');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const MODEL_PATH = path.join(__dirname, '..', '..', 'model.nlp');

let manager = new NlpManager({ languages: ['en'], forceNER: true, autoSave: false, nlu: { log: false } });

function trainModel() {
  logger.info('[HawkAI NLP] Training local NLP engine (43 intents)...');

  // ── Entities ──────────────────────────────────────────────────────────────
  manager.addRegexEntity('awb', 'en', /[A-Z0-9]{6,16}/gi);
  manager.addRegexEntity('clientCode', 'en', /\b[A-Z][A-Z0-9]{2,4}\b/g);
  manager.addRegexEntity('date', 'en', /\d{4}-\d{2}-\d{2}/gi);
  manager.addRegexEntity('dateRelative', 'en', /\b(today|yesterday|tomorrow)\b/gi);
  manager.addRegexEntity('courier', 'en', /\b(dtdc|trackon|delhivery|bluedart|xpressbees)\b/gi);
  manager.addRegexEntity('weight', 'en', /\b\d+(?:\.\d+)?\s*(?:kg|kgs|kilo|kilograms)\b/gi);
  manager.addRegexEntity('amount', 'en', /\b(?:rs|₹|inr)?\s*\d+(?:,\d{3})*(?:\.\d+)?\b/gi);

  // ═══════════════════════════════════════════════════════════════════════════
  // CLIENT MANAGEMENT (5 intents)
  // ═══════════════════════════════════════════════════════════════════════════

  // intent.client.create
  manager.addDocument('en', 'create a client', 'intent.client.create');
  manager.addDocument('en', 'add new client', 'intent.client.create');
  manager.addDocument('en', 'create client %clientCode%', 'intent.client.create');
  manager.addDocument('en', 'onboard a new client', 'intent.client.create');
  manager.addDocument('en', 'register client', 'intent.client.create');
  manager.addDocument('en', 'setup new client account', 'intent.client.create');
  manager.addDocument('en', 'new client', 'intent.client.create');

  // intent.client.update
  manager.addDocument('en', 'update client %clientCode%', 'intent.client.update');
  manager.addDocument('en', 'edit client details', 'intent.client.update');
  manager.addDocument('en', 'change client phone', 'intent.client.update');
  manager.addDocument('en', 'modify client %clientCode%', 'intent.client.update');
  manager.addDocument('en', 'update company name for %clientCode%', 'intent.client.update');

  // intent.client.deactivate
  manager.addDocument('en', 'deactivate client %clientCode%', 'intent.client.deactivate');
  manager.addDocument('en', 'disable client', 'intent.client.deactivate');
  manager.addDocument('en', 'suspend client %clientCode%', 'intent.client.deactivate');
  manager.addDocument('en', 'block client', 'intent.client.deactivate');

  // intent.client.stats
  manager.addDocument('en', 'client stats for %clientCode%', 'intent.client.stats');
  manager.addDocument('en', 'show stats for %clientCode%', 'intent.client.stats');
  manager.addDocument('en', 'client analytics for %clientCode%', 'intent.client.stats');
  manager.addDocument('en', 'client revenue for %clientCode%', 'intent.client.stats');
  manager.addDocument('en', 'how is %clientCode% doing', 'intent.client.stats');

  // intent.client.list
  manager.addDocument('en', 'show all clients', 'intent.client.list');
  manager.addDocument('en', 'list clients', 'intent.client.list');
  manager.addDocument('en', 'client list', 'intent.client.list');
  manager.addDocument('en', 'all clients', 'intent.client.list');
  manager.addDocument('en', 'who are our clients', 'intent.client.list');

  // ═══════════════════════════════════════════════════════════════════════════
  // SHIPMENT OPERATIONS (6 intents)
  // ═══════════════════════════════════════════════════════════════════════════

  // intent.shipment.create
  manager.addDocument('en', 'create shipment', 'intent.shipment.create');
  manager.addDocument('en', 'book a parcel', 'intent.shipment.create');
  manager.addDocument('en', 'enter new shipment for %clientCode%', 'intent.shipment.create');
  manager.addDocument('en', 'add shipment', 'intent.shipment.create');
  manager.addDocument('en', 'new entry', 'intent.shipment.create');
  manager.addDocument('en', 'book shipment for %clientCode%', 'intent.shipment.create');
  manager.addDocument('en', 'create a new parcel', 'intent.shipment.create');

  // intent.shipment.track
  manager.addDocument('en', 'track %awb%', 'intent.shipment.track');
  manager.addDocument('en', 'where is %awb%', 'intent.shipment.track');
  manager.addDocument('en', 'status of %awb%', 'intent.shipment.track');
  manager.addDocument('en', 'find shipment %awb%', 'intent.shipment.track');
  manager.addDocument('en', 'track my parcel', 'intent.shipment.track');
  manager.addDocument('en', 'check tracking', 'intent.shipment.track');
  manager.addDocument('en', 'tracking update', 'intent.shipment.track');

  // intent.shipment.status
  manager.addDocument('en', 'mark shipment as delivered', 'intent.shipment.status');
  manager.addDocument('en', 'update shipment status', 'intent.shipment.status');
  manager.addDocument('en', 'change status of %awb%', 'intent.shipment.status');
  manager.addDocument('en', 'mark %awb% delivered', 'intent.shipment.status');
  manager.addDocument('en', 'set shipment to rto', 'intent.shipment.status');

  // intent.shipment.delete
  manager.addDocument('en', 'delete shipment %awb%', 'intent.shipment.delete');
  manager.addDocument('en', 'remove shipment', 'intent.shipment.delete');
  manager.addDocument('en', 'cancel shipment %awb%', 'intent.shipment.delete');
  manager.addDocument('en', 'delete entry', 'intent.shipment.delete');

  // intent.shipment.search
  manager.addDocument('en', 'search shipments', 'intent.shipment.search');
  manager.addDocument('en', 'find shipments for %clientCode%', 'intent.shipment.search');
  manager.addDocument('en', 'search for mumbai shipments', 'intent.shipment.search');
  manager.addDocument('en', 'look up shipments', 'intent.shipment.search');
  manager.addDocument('en', 'search parcels', 'intent.shipment.search');

  // intent.shipment.monthly
  manager.addDocument('en', 'monthly stats', 'intent.shipment.monthly');
  manager.addDocument('en', 'april stats', 'intent.shipment.monthly');
  manager.addDocument('en', 'this month shipments', 'intent.shipment.monthly');
  manager.addDocument('en', 'monthly report', 'intent.shipment.monthly');
  manager.addDocument('en', 'shipments this month', 'intent.shipment.monthly');

  // ═══════════════════════════════════════════════════════════════════════════
  // INVOICE & BILLING (3 intents)
  // ═══════════════════════════════════════════════════════════════════════════

  // intent.invoice.generate
  manager.addDocument('en', 'generate invoice', 'intent.invoice.generate');
  manager.addDocument('en', 'create invoice for %clientCode%', 'intent.invoice.generate');
  manager.addDocument('en', 'create bill for %clientCode%', 'intent.invoice.generate');
  manager.addDocument('en', 'bill client %clientCode%', 'intent.invoice.generate');
  manager.addDocument('en', 'send invoice to %clientCode%', 'intent.invoice.generate');
  manager.addDocument('en', 'generate monthly invoice', 'intent.invoice.generate');

  // intent.invoice.list
  manager.addDocument('en', 'show invoices', 'intent.invoice.list');
  manager.addDocument('en', 'list invoices', 'intent.invoice.list');
  manager.addDocument('en', 'all invoices', 'intent.invoice.list');
  manager.addDocument('en', 'invoice list', 'intent.invoice.list');
  manager.addDocument('en', 'show all bills', 'intent.invoice.list');

  // intent.invoice.paid
  manager.addDocument('en', 'mark invoice paid', 'intent.invoice.paid');
  manager.addDocument('en', 'invoice paid', 'intent.invoice.paid');
  manager.addDocument('en', 'payment received for invoice', 'intent.invoice.paid');
  manager.addDocument('en', 'mark bill as paid', 'intent.invoice.paid');

  // ═══════════════════════════════════════════════════════════════════════════
  // WALLET (6 intents)
  // ═══════════════════════════════════════════════════════════════════════════

  // intent.wallet.credit
  manager.addDocument('en', 'add money to %clientCode%', 'intent.wallet.credit');
  manager.addDocument('en', 'credit wallet %clientCode%', 'intent.wallet.credit');
  manager.addDocument('en', 'recharge wallet for %clientCode%', 'intent.wallet.credit');
  manager.addDocument('en', 'add %amount% to %clientCode% wallet', 'intent.wallet.credit');
  manager.addDocument('en', 'top up %clientCode%', 'intent.wallet.credit');
  manager.addDocument('en', 'credit %clientCode%', 'intent.wallet.credit');

  // intent.wallet.balance
  manager.addDocument('en', 'check wallet for %clientCode%', 'intent.wallet.balance');
  manager.addDocument('en', 'wallet balance %clientCode%', 'intent.wallet.balance');
  manager.addDocument('en', '%clientCode% wallet', 'intent.wallet.balance');
  manager.addDocument('en', 'how much balance does %clientCode% have', 'intent.wallet.balance');
  manager.addDocument('en', 'check balance', 'intent.wallet.balance');

  // intent.wallet.debit
  manager.addDocument('en', 'deduct from %clientCode%', 'intent.wallet.debit');
  manager.addDocument('en', 'debit wallet %clientCode%', 'intent.wallet.debit');
  manager.addDocument('en', 'deduct %amount% from %clientCode%', 'intent.wallet.debit');
  manager.addDocument('en', 'charge %clientCode%', 'intent.wallet.debit');
  manager.addDocument('en', 'debit client', 'intent.wallet.debit');

  // intent.wallet.adjust
  manager.addDocument('en', 'adjust wallet for %clientCode%', 'intent.wallet.adjust');
  manager.addDocument('en', 'wallet adjustment', 'intent.wallet.adjust');
  manager.addDocument('en', 'correct balance for %clientCode%', 'intent.wallet.adjust');
  manager.addDocument('en', 'fix wallet balance', 'intent.wallet.adjust');

  // intent.wallet.history
  manager.addDocument('en', 'wallet history for %clientCode%', 'intent.wallet.history');
  manager.addDocument('en', 'show %clientCode% transactions', 'intent.wallet.history');
  manager.addDocument('en', 'transaction history', 'intent.wallet.history');
  manager.addDocument('en', 'wallet ledger %clientCode%', 'intent.wallet.history');
  manager.addDocument('en', '%clientCode% wallet history', 'intent.wallet.history');

  // intent.wallet.negative
  manager.addDocument('en', 'show negative wallets', 'intent.wallet.negative');
  manager.addDocument('en', 'who has low balance', 'intent.wallet.negative');
  manager.addDocument('en', 'negative wallet clients', 'intent.wallet.negative');
  manager.addDocument('en', 'clients with debt', 'intent.wallet.negative');
  manager.addDocument('en', 'who owes money', 'intent.wallet.negative');

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTRACTS (3 intents)
  // ═══════════════════════════════════════════════════════════════════════════

  // intent.contract.create
  manager.addDocument('en', 'create contract for %clientCode%', 'intent.contract.create');
  manager.addDocument('en', 'new pricing contract', 'intent.contract.create');
  manager.addDocument('en', 'add contract', 'intent.contract.create');
  manager.addDocument('en', 'set up pricing for %clientCode%', 'intent.contract.create');
  manager.addDocument('en', 'create rate card', 'intent.contract.create');

  // intent.contract.list
  manager.addDocument('en', 'show contracts', 'intent.contract.list');
  manager.addDocument('en', 'list contracts', 'intent.contract.list');
  manager.addDocument('en', 'all pricing contracts', 'intent.contract.list');
  manager.addDocument('en', 'rate cards', 'intent.contract.list');

  // intent.contract.rate
  manager.addDocument('en', 'calculate rate for %clientCode%', 'intent.contract.rate');
  manager.addDocument('en', 'rate for %clientCode% %weight% %courier%', 'intent.contract.rate');
  manager.addDocument('en', 'shipping rate', 'intent.contract.rate');
  manager.addDocument('en', 'how much for %weight% via %courier%', 'intent.contract.rate');
  manager.addDocument('en', 'price calculator', 'intent.contract.rate');

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS (2 intents)
  // ═══════════════════════════════════════════════════════════════════════════

  // intent.notification.digest
  manager.addDocument('en', 'send status to %clientCode% for today', 'intent.notification.digest');
  manager.addDocument('en', 'send daily digest to %clientCode%', 'intent.notification.digest');
  manager.addDocument('en', 'notify %clientCode% about today', 'intent.notification.digest');
  manager.addDocument('en', 'send digest', 'intent.notification.digest');
  manager.addDocument('en', 'send status update for %clientCode%', 'intent.notification.digest');
  manager.addDocument('en', 'email daily report to %clientCode%', 'intent.notification.digest');

  // intent.notification.pod
  manager.addDocument('en', 'send pod for %awb%', 'intent.notification.pod');
  manager.addDocument('en', 'send proof of delivery', 'intent.notification.pod');
  manager.addDocument('en', 'email pod', 'intent.notification.pod');
  manager.addDocument('en', 'send delivery proof for %awb%', 'intent.notification.pod');

  // ═══════════════════════════════════════════════════════════════════════════
  // NDR (2 intents)
  // ═══════════════════════════════════════════════════════════════════════════

  // intent.ndr.list
  manager.addDocument('en', 'show pending ndrs', 'intent.ndr.list');
  manager.addDocument('en', 'pending ndr', 'intent.ndr.list');
  manager.addDocument('en', 'ndrs requiring action', 'intent.ndr.list');
  manager.addDocument('en', 'what requires action', 'intent.ndr.list');
  manager.addDocument('en', 'delivery failures', 'intent.ndr.list');
  manager.addDocument('en', 'undelivered shipments', 'intent.ndr.list');

  // intent.ndr.resolve
  manager.addDocument('en', 'resolve ndr for %awb%', 'intent.ndr.resolve');
  manager.addDocument('en', 'reattempt %awb%', 'intent.ndr.resolve');
  manager.addDocument('en', 'reattempt delivery', 'intent.ndr.resolve');
  manager.addDocument('en', 'mark ndr rto', 'intent.ndr.resolve');
  manager.addDocument('en', 'update ndr address', 'intent.ndr.resolve');

  // ═══════════════════════════════════════════════════════════════════════════
  // RETURNS (4 intents)
  // ═══════════════════════════════════════════════════════════════════════════

  // intent.return.list
  manager.addDocument('en', 'show returns', 'intent.return.list');
  manager.addDocument('en', 'list return requests', 'intent.return.list');
  manager.addDocument('en', 'pending returns', 'intent.return.list');
  manager.addDocument('en', 'return requests', 'intent.return.list');

  // intent.return.approve
  manager.addDocument('en', 'approve return', 'intent.return.approve');
  manager.addDocument('en', 'accept return request', 'intent.return.approve');
  manager.addDocument('en', 'approve return number', 'intent.return.approve');

  // intent.return.reject
  manager.addDocument('en', 'reject return', 'intent.return.reject');
  manager.addDocument('en', 'deny return request', 'intent.return.reject');
  manager.addDocument('en', 'decline return', 'intent.return.reject');

  // intent.return.stats
  manager.addDocument('en', 'return stats', 'intent.return.stats');
  manager.addDocument('en', 'return statistics', 'intent.return.stats');
  manager.addDocument('en', 'how many returns', 'intent.return.stats');
  manager.addDocument('en', 'return summary', 'intent.return.stats');

  // ═══════════════════════════════════════════════════════════════════════════
  // DRAFT ORDERS (2 intents)
  // ═══════════════════════════════════════════════════════════════════════════

  // intent.draft.create
  manager.addDocument('en', 'create draft order', 'intent.draft.create');
  manager.addDocument('en', 'add draft for %clientCode%', 'intent.draft.create');
  manager.addDocument('en', 'new draft order', 'intent.draft.create');
  manager.addDocument('en', 'queue order for %clientCode%', 'intent.draft.create');

  // intent.draft.list
  manager.addDocument('en', 'show draft orders', 'intent.draft.list');
  manager.addDocument('en', 'list drafts', 'intent.draft.list');
  manager.addDocument('en', 'pending drafts', 'intent.draft.list');
  manager.addDocument('en', 'draft queue', 'intent.draft.list');
  manager.addDocument('en', 'show order queue', 'intent.draft.list');

  // ═══════════════════════════════════════════════════════════════════════════
  // PICKUPS (2 intents)
  // ═══════════════════════════════════════════════════════════════════════════

  // intent.pickup.create
  manager.addDocument('en', 'schedule pickup for %clientCode%', 'intent.pickup.create');
  manager.addDocument('en', 'create pickup request', 'intent.pickup.create');
  manager.addDocument('en', 'book pickup', 'intent.pickup.create');
  manager.addDocument('en', 'new pickup', 'intent.pickup.create');
  manager.addDocument('en', 'schedule collection', 'intent.pickup.create');

  // intent.pickup.list
  manager.addDocument('en', 'show pickups', 'intent.pickup.list');
  manager.addDocument('en', 'today pickups', 'intent.pickup.list');
  manager.addDocument('en', 'list pickup requests', 'intent.pickup.list');
  manager.addDocument('en', 'pending pickups', 'intent.pickup.list');

  // ═══════════════════════════════════════════════════════════════════════════
  // QUOTES (3 intents)
  // ═══════════════════════════════════════════════════════════════════════════

  // intent.quote.create
  manager.addDocument('en', 'create quote for %clientCode%', 'intent.quote.create');
  manager.addDocument('en', 'new quote', 'intent.quote.create');
  manager.addDocument('en', 'generate a quotation', 'intent.quote.create');
  manager.addDocument('en', 'price quote for client', 'intent.quote.create');

  // intent.quote.list
  manager.addDocument('en', 'show quotes', 'intent.quote.list');
  manager.addDocument('en', 'list quotes', 'intent.quote.list');
  manager.addDocument('en', 'recent quotes', 'intent.quote.list');
  manager.addDocument('en', 'quotation list', 'intent.quote.list');

  // intent.quote.stats
  manager.addDocument('en', 'quote stats', 'intent.quote.stats');
  manager.addDocument('en', 'quote conversion rate', 'intent.quote.stats');
  manager.addDocument('en', 'quotation analytics', 'intent.quote.stats');
  manager.addDocument('en', 'how are quotes performing', 'intent.quote.stats');

  // ═══════════════════════════════════════════════════════════════════════════
  // RECONCILIATION (2 intents)
  // ═══════════════════════════════════════════════════════════════════════════

  // intent.recon.stats
  manager.addDocument('en', 'reconciliation stats', 'intent.recon.stats');
  manager.addDocument('en', 'recon summary', 'intent.recon.stats');
  manager.addDocument('en', 'compare charges', 'intent.recon.stats');
  manager.addDocument('en', 'billing audit', 'intent.recon.stats');
  manager.addDocument('en', 'overcharge report', 'intent.recon.stats');

  // intent.recon.disputes
  manager.addDocument('en', 'show disputes', 'intent.recon.disputes');
  manager.addDocument('en', 'open disputes', 'intent.recon.disputes');
  manager.addDocument('en', 'billing disputes', 'intent.recon.disputes');
  manager.addDocument('en', 'list disputes', 'intent.recon.disputes');

  // ═══════════════════════════════════════════════════════════════════════════
  // SYSTEM & REPORTING (3 intents)
  // ═══════════════════════════════════════════════════════════════════════════

  // intent.system.overview
  manager.addDocument('en', 'system overview', 'intent.system.overview');
  manager.addDocument('en', 'how are things', 'intent.system.overview');
  manager.addDocument('en', 'show dashboard', 'intent.system.overview');
  manager.addDocument('en', 'overview', 'intent.system.overview');
  manager.addDocument('en', 'what is happening', 'intent.system.overview');
  manager.addDocument('en', 'status update', 'intent.system.overview');

  // intent.system.courier_perf
  manager.addDocument('en', 'courier performance', 'intent.system.courier_perf');
  manager.addDocument('en', 'which courier is best', 'intent.system.courier_perf');
  manager.addDocument('en', 'courier stats', 'intent.system.courier_perf');
  manager.addDocument('en', 'compare couriers', 'intent.system.courier_perf');
  manager.addDocument('en', 'courier comparison', 'intent.system.courier_perf');

  // intent.report.daily
  manager.addDocument('en', 'daily report', 'intent.report.daily');
  manager.addDocument('en', 'show daily report for %dateRelative%', 'intent.report.daily');
  manager.addDocument('en', 'what happened %dateRelative%', 'intent.report.daily');
  manager.addDocument('en', 'today report', 'intent.report.daily');
  manager.addDocument('en', 'daily summary', 'intent.report.daily');
  manager.addDocument('en', 'operations report', 'intent.report.daily');

  // Fallback
  manager.addAnswer('en', 'None', "I'm not sure what you mean. Try: 'create client', 'track AWB', 'generate invoice', 'daily report', 'show overview', 'wallet balance', or 'list returns'.");

  return manager.train();
}

async function initNlp() {
  if (fs.existsSync(MODEL_PATH)) {
    try {
      manager.load(MODEL_PATH);
      logger.info('[HawkAI NLP] Loaded trained local model from disk.');
    } catch (e) {
      await trainModel();
      manager.save(MODEL_PATH);
    }
  } else {
    await trainModel();
    manager.save(MODEL_PATH);
  }
}

async function processMessage(msg) {
  const result = await manager.process('en', msg);
  
  const entities = {};
  for (const ent of result.entities || []) {
    if (!entities[ent.entity] || entities[ent.entity + '_confidence'] < ent.accuracy) {
      entities[ent.entity] = ent.resolution ? ent.resolution.value || ent.sourceText : ent.sourceText;
      entities[ent.entity + '_confidence'] = ent.accuracy;
    }
  }

  return {
    intent: result.intent,
    confidence: result.score,
    entities,
    answer: result.answer,
  };
}

module.exports = { initNlp, processMessage };
