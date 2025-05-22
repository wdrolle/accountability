module.exports = {
  apps: [{
    name: 'god-scheduler',
    script: 'scripts/scheduler-worker.js',
    watch: false,
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: process.env.DATABASE_URL
    },
    instances: 1,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
    exp_backoff_restart_delay: 100,
    error_file: 'logs/scheduler-error.log',
    out_file: 'logs/scheduler-out.log',
    merge_logs: true,
    time: true
  }]
}; 