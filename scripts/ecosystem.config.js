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
  }, {
    name: 'journal-ai-worker',
    script: 'scripts/journal-ai-worker.js',
    cwd: '/root/accountability',
    exec_mode: 'fork',
    watch: false,
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: process.env.DATABASE_URL,
      LOCAL_PC_OLLAMA_HOST: process.env.LOCAL_PC_OLLAMA_HOST,
      LOCAL_PC_OLLAMA_USER: process.env.LOCAL_PC_OLLAMA_USER,
      LOCAL_PC_OLLAMA_PASSWORD: process.env.LOCAL_PC_OLLAMA_PASSWORD,
      OLLAMA_NGROK_USER: process.env.OLLAMA_NGROK_USER,
      OLLAMA_NGROK_PASSWORD: process.env.OLLAMA_NGROK_PASSWORD,
      OLLAMA_API_URL: process.env.OLLAMA_API_URL,
      NEXT_PUBLIC_OLLAMA_URL: process.env.NEXT_PUBLIC_OLLAMA_URL,
      OLLAMA_MODEL: process.env.OLLAMA_MODEL
    },
    instances: 1,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
    exp_backoff_restart_delay: 100,
    error_file: 'logs/journal-ai-worker-error.log',
    out_file: 'logs/journal-ai-worker-out.log',
    merge_logs: true,
    time: true
  }]
};