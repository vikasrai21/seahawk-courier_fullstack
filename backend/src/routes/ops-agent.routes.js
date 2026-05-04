"use strict";
// ops-agent.routes.js — HawkAI owner agent + SkyAI ops assistant
// Split from ops.routes.js for maintainability

const router = require("express").Router();
const R = require("../utils/response");
const { ownerOnly } = require("../middleware/auth.middleware");
const ownerAgent = require("../services/ownerAgent.service");
const adminAssistant = require("../services/adminAssistant.service");
const logger = require("../utils/logger");

// ── Owner-Only Agent Routes (HawkAI) ─────────────────────────────────────

// POST /api/ops/agent/chat — HawkAI enterprise agent chat
router.post("/agent/chat", ownerOnly, async (req, res) => {
  try {
    const { message, history = [], debug = false } = req.body;
    if (!message?.trim()) return R.error(res, "message is required", 400);
    if (message.length > 2000) return R.error(res, "message too long", 400);
    const result = await ownerAgent.chat({ message: message.trim(), history, debug });
    R.ok(res, result);
  } catch (err) {
    logger.error(`[HawkAI] Chat error: ${err.message}`);
    R.error(res, "Agent error", 500);
  }
});

// POST /api/ops/agent/execute — execute a confirmed agent action
router.post("/agent/execute", ownerOnly, async (req, res) => {
  try {
    const { action, params } = req.body;
    if (!action) return R.error(res, "action is required", 400);
    const result = await ownerAgent.executeConfirmedAction(
      action,
      params || {},
    );
    R.ok(res, result);
  } catch (err) {
    logger.error(`[HawkAI] Execute error: ${err.message}`);
    R.error(res, "Action execution error", 500);
  }
});

// GET /api/ops/agent/memory — view agent's learned patterns
router.get("/agent/memory", ownerOnly, async (req, res) => {
  try {
    const summary = await ownerAgent.getMemorySummary();
    R.ok(res, summary);
  } catch (err) {
    R.error(res, err.message);
  }
});

// GET /api/ops/agent/history — view agent's action history
router.get("/agent/history", ownerOnly, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const history = await ownerAgent.getActionHistory(limit);
    R.ok(res, history);
  } catch (err) {
    R.error(res, err.message);
  }
});

// POST /api/ops/agent/teach — manually teach agent a pattern
router.post("/agent/teach", ownerOnly, async (req, res) => {
  try {
    const { category, contextKey, decision, metadata } = req.body;
    if (!category || !contextKey || !decision)
      return R.error(
        res,
        "category, contextKey, and decision are required",
        400,
      );
    const result = await ownerAgent.teach({
      category,
      contextKey,
      decision,
      metadata,
    });
    R.ok(res, result);
  } catch (err) {
    R.error(res, err.message);
  }
});

// ── SkyAI Internal Ops Assistant ──────────────────────────────────────────

function allowOpsAssistant(req, res, next) {
  if (!req.user) return R.unauthorized(res);
  if (req.user.isOwner || ["ADMIN", "OPS_MANAGER"].includes(req.user.role))
    return next();
  return R.forbidden(
    res,
    "Access denied. Required: ADMIN, OPS_MANAGER, or owner access",
  );
}

// POST /api/ops/assistant/chat — SkyAI internal ops assistant
router.post("/assistant/chat", allowOpsAssistant, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) return R.error(res, "message is required", 400);
    if (message.length > 500) return R.error(res, "message too long", 400);

    const { reply, action } = await adminAssistant.chat({
      message: message.trim(),
      history,
    });

    let data = null;
    let finalReply = reply;
    if (action?.requiresData) {
      data = await adminAssistant.resolveAction(action);
      finalReply = adminAssistant.summarizeAction(action, data) || reply;
    } else if (action?.type === "GET_OVERVIEW") {
      data = await adminAssistant.resolveAction(action);
      finalReply = adminAssistant.summarizeAction(action, data) || reply;
    }

    R.ok(res, { reply: finalReply, action, data });
  } catch (err) {
    logger.error(`SkyAI route error: ${err.message}`);
    R.error(res, "AI assistant error", 500);
  }
});

// POST /api/ops/assistant/execute — run a confirmed action
router.post("/assistant/execute", allowOpsAssistant, async (req, res) => {
  try {
    const { action } = req.body;
    if (!action?.type) return R.error(res, "action is required", 400);
    const data = await adminAssistant.resolveAction(action);
    R.ok(res, { data });
  } catch (err) {
    logger.error(`SkyAI execute error: ${err.message}`);
    R.error(res, "Action execution error", 500);
  }
});

module.exports = router;
