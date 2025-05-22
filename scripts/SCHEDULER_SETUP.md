# God Scheduler Setup Instructions (WSL)

This document outlines the steps to set up the God Scheduler worker service using PM2 in WSL environment.

## Prerequisites

1. Node.js installed on your system
2. PostgreSQL database (Supabase)
3. WSL (Windows Subsystem for Linux)
4. Sudo privileges on your system

## Installation Steps

1. Set up environment variables:
Create a `.env` file in the project root:
```bash
echo "DATABASE_URL=postgres://your_connection_string_here" > .env
```
Or set it directly in your shell:
```bash
export DATABASE_URL=postgres://your_connection_string_here
```

2. Run the setup script with sudo (required for first-time installation):
```bash
chmod +x scripts/scheduler-setup.sh
sudo ./scripts/scheduler-setup.sh
```

For subsequent runs (if PM2 is already installed), you can run without sudo:
```bash
./scripts/scheduler-setup.sh
```

## Monitoring

Check service status:
```bash
pm2 status god-scheduler
```

View logs:
```bash
pm2 logs god-scheduler
```

Monitor memory and CPU:
```bash
pm2 monit
```

## Troubleshooting

1. If you get permission errors:
   - Make sure to run the initial setup with sudo
   - Check if the logs directory is owned by your user
   - Run `sudo chown -R $USER:$USER logs` if needed

2. If the service fails to start:
   - Check logs: `pm2 logs god-scheduler`
   - Verify DATABASE_URL environment variable is set correctly
   - Ensure Node.js is installed and accessible
   - Check file permissions

3. If jobs aren't running:
   - Verify database connection
   - Check if scheduler schema is properly set up
   - Ensure jobs are active in scheduler.job table
   - Check detailed logs: `pm2 logs god-scheduler --lines 100`

## Maintenance

Restart the service:
```bash
pm2 restart god-scheduler
```

Stop the service:
```bash
pm2 stop god-scheduler
```

Update configuration:
1. Update environment variables if needed
2. Run `pm2 reload god-scheduler`

Save PM2 configuration:
```bash
pm2 save
```

## Security Notes

1. Keep your .env file secure and never commit it to version control
2. Use appropriate system user permissions
3. Monitor logs for unauthorized access attempts
4. Regularly update dependencies
5. Only use sudo when necessary for global installations

## Support

For issues or questions:
1. Check the logs using `pm2 logs`
2. Review database job status
3. Contact system administrator

## Common PM2 Commands

```bash
# List all processes
pm2 list

# Monitor CPU/Memory
pm2 monit

# View detailed logs
pm2 logs god-scheduler

# Restart process
pm2 restart god-scheduler

# Stop process
pm2 stop god-scheduler

# Remove process
pm2 delete god-scheduler

# Save current process list
pm2 save

# Startup script (requires sudo)
sudo env PATH=$PATH:/usr/local/bin pm2 startup systemd -u $USER --hp $HOME
``` 

# this file is used to configure the scheduler
  <!-- PM2 configuration file
  Includes database connection
  Configures logging and restart policies
  Sets up error handling -->
scripts\ecosystem.config.js

# This file is used to start the scheduler on the server.
# systemd service file. I will need to replace this when running on the server.
  <!-- Systemd service file
  Configured for your Supabase database
  Includes proper logging and restart settings
  Depends on network and PostgreSQL services -->
scripts\god-scheduler.service 

# This file is used to start the scheduler on the server.
  <!-- Installs PM2 if not present
  Sets up the scheduler process
  Configures auto-start
  Provides helpful commands -->
scripts\scheduler-setup.sh 

# This file is used to run the scheduler worker.
  <!-- Runs as a separate background process using PM2
  Connects to your database and checks for jobs to run every minute
  Actually executes the jobs shown in your table (like check-trial-status, daily-send-messages, etc.)
  Runs independently of your website - even when your website is down, these jobs will still run
  Handles scheduled tasks like:
  daily-send-messages (runs at "0 5 ")
  monthly-reset-usage (runs at "0 0 1 ")
  cleanup-expired-invitations (runs at "0 0 ")
  etc. -->
scripts\scheduler-worker.js