// ecosystem.config.js — PM2 process manager config
// Fix #10: Cross-platform alternative to .bat files
// 
// Install PM2: npm install -g pm2
// Start:       pm2 start ecosystem.config.js --env production
// Save:        pm2 save
// Auto-start:  pm2 startup (then run the command it shows)
// Logs:        pm2 logs seahawk
// Monitor:     pm2 monit

module.exports = {
  apps: [
    {
      name:        'seahawk',
      script:      'server.js',
      cwd:         './backend',
      instances:   1,                // Increase for multi-core (or 'max')
      exec_mode:   'fork',           // Use 'cluster' if instances > 1
      watch:       false,            // Never watch in production
      max_memory_restart: '500M',    // Auto-restart if memory exceeds 500MB

      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT:     3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT:     3001,
      },

      // Log settings
      out_file:      './logs/pm2-out.log',
      error_file:    './logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs:    true,

      // Auto restart on crash
      restart_delay:   5000,    // 5s between restarts
      max_restarts:    10,
      min_uptime:      '5s',    // Must be up 5s to count as a successful start

      // Graceful shutdown
      kill_timeout:    10000,   // 10s to gracefully shutdown
      listen_timeout:  10000,
    },
  ],
};
