// server.js — Application entry point
'use strict';

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const os = require('os');
const { createServer } = require('http');

function isDisabledFlag(value) {
  return typeof value === 'string' && ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function writeStartupError(err, context = 'startup') {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : '';
  process.stderr.write(`[SEAHAWK:${context}] ${message}\n`);
  if (stack) process.stderr.write(`${stack}\n`);
}

process.on('uncaughtException', (err) => {
  writeStartupError(err, 'uncaughtException');
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  writeStartupError(err, 'unhandledRejection');
  process.exit(1);
});

function getLANIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'YOUR_IP';
}

async function startServer() {
  let app;
  let config;
  let logger;
  let prisma;
  let startScheduler;
  let ensureStartupOwner;
  let initWorkers;
  let initSocket;

  try {
    app = require('./src/app');
    config = require('./src/config');
    logger = require('./src/utils/logger');
    prisma = require('./src/config/prisma');
    ({ startScheduler } = require('./src/utils/scheduler'));
    ({ ensureStartupOwner } = require('./src/utils/startup-owner-bootstrap'));
    ({ initWorkers } = require('./src/workers/scanner.worker'));
    ({ initSocket } = require('./src/realtime/socket'));
  } catch (err) {
    writeStartupError(err, 'module-load');
    process.exit(1);
  }

  try {
    await prisma.$connect();
    logger.info('Database connected successfully.');
    await ensureStartupOwner();
  } catch (err) {
    logger.error('Failed to connect to database. Exiting.', { error: err.message });
    writeStartupError(err, 'database');
    process.exit(1);
  }

  const httpServer = createServer(app);

  try {
    await initSocket(httpServer);
  } catch (err) {
    logger.error('Socket initialization failed. Exiting.', { error: err.message });
    writeStartupError(err, 'socket');
    process.exit(1);
  }

  const server = httpServer.listen(config.port, '0.0.0.0', () => {
    const lanIP = getLANIP();

    if (config.isDev) {
      process.stdout.write('\n================================================\n');
      process.stdout.write('  SEAHAWK COURIER & CARGO v2.0\n');
      process.stdout.write('================================================\n');
      process.stdout.write(`\n  Local:          http://localhost:${config.port}\n`);
      process.stdout.write(`  Network:        http://${lanIP}:${config.port}\n`);
      process.stdout.write(`  Health:         http://localhost:${config.port}/api/health\n`);
      process.stdout.write(`  Environment:    ${config.env}\n`);
      process.stdout.write('\n  Keep this window open. Ctrl+C to stop.\n');
      process.stdout.write('================================================\n\n');
    } else {
      logger.info(`Server started on port ${config.port}`, { env: config.env, ip: lanIP });
    }
  });

  try {
    const disableBackgroundJobs =
      isDisabledFlag(process.env.DISABLE_BACKGROUND_JOBS) ||
      isDisabledFlag(process.env.PERF_PROOF_MODE);

    if (disableBackgroundJobs) {
      logger.warn('Background jobs disabled for this server process.', {
        disableBackgroundJobs: process.env.DISABLE_BACKGROUND_JOBS,
        perfProofMode: process.env.PERF_PROOF_MODE,
      });
    } else {
      startScheduler();
      initWorkers();
    }
  } catch (err) {
    logger.error('Background startup failed. Exiting.', { error: err.message });
    writeStartupError(err, 'background-jobs');
    process.exit(1);
  }

  const shutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Server closed. Goodbye.');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  writeStartupError(err, 'startServer');
  process.exit(1);
});
