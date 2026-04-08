// server.js — Application entry point
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const os     = require('os');
const { createServer } = require('http');
const app    = require('./src/app');
const config = require('./src/config');
const logger = require('./src/utils/logger');
const prisma = require('./src/config/prisma');
const { startScheduler } = require('./src/utils/scheduler');
const { initWorkers } = require('./src/workers/scanner.worker');
const { initSocket } = require('./src/realtime/socket');

function getLANIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'YOUR_IP';
}

async function startServer() {
  // ── Verify DB connection before accepting traffic ──────────────────────
  try {
    await prisma.$connect();
    logger.info('Database connected successfully.');


  } catch (err) {
    logger.error('Failed to connect to database. Exiting.', { error: err.message });
    process.exit(1);
  }

  const httpServer = createServer(app);
  await initSocket(httpServer);

  const server = httpServer.listen(config.port, '0.0.0.0', () => {
    const lanIP = getLANIP();

    if (config.isDev) {
      console.log('\n================================================');
      console.log('  🦅  SEAHAWK COURIER & CARGO v2.0');
      console.log('================================================');
      console.log(`\n  ✅  Local:          http://localhost:${config.port}`);
      console.log(`  🌐  Network:        http://${lanIP}:${config.port}`);
      console.log(`  📊  Health:         http://localhost:${config.port}/api/health`);
      console.log(`  🔧  Environment:    ${config.env}`);
      console.log('\n  Keep this window open. Ctrl+C to stop.');
      console.log('================================================\n');
    } else {
      logger.info(`Server started on port ${config.port}`, { env: config.env, ip: lanIP });
    }
  });

  // ── Start background jobs & workers ────────────────────────────────────────────
  startScheduler();
  initWorkers();

  // ── Graceful shutdown ────────────────────────────────────────────────
  const shutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Server closed. Goodbye.');
      process.exit(0);
    });
    // Force exit if graceful shutdown takes too long
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  // Handle uncaught errors (last resort — already logged by Winston)
  process.on('uncaughtException',  (err) => { logger.error('Uncaught Exception',  { error: err.message, stack: err.stack }); process.exit(1); });
  process.on('unhandledRejection', (err) => { logger.error('Unhandled Rejection', { error: err }); process.exit(1); });
}

startServer();
