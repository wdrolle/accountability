#!/bin/bash
# permissions: chmod +x scripts/scheduler-setup.sh
# run: scripts/scheduler-setup.sh
# first time: sudo ./scripts/scheduler-setup.sh

# Check if script is run with sudo when needed
if [ "$EUID" -ne 0 ]; then 
    if ! command -v pm2 &> /dev/null; then
        echo "PM2 is not installed. Please run this script with sudo to install PM2 globally:"
        echo "sudo $0"
        exit 1
    fi
fi

# Load DATABASE_URL from .env file
if [ -f .env ]; then
    DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d '=' -f2- | tr -d '"')
    # Remove pgbouncer parameter if present
    DATABASE_URL=$(echo "$DATABASE_URL" | sed 's/?pgbouncer=true//')
else
    echo "Error: .env file not found"
    exit 1
fi

# Check if we got DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL not found in .env file"
    exit 1
fi

echo "DATABASE_URL: $DATABASE_URL"

# Install PM2 globally if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2@latest
    
    # Verify installation
    if ! command -v pm2 &> /dev/null; then
        echo "Error: Failed to install PM2"
        exit 1
    fi
fi

# Install project dependencies
echo "Installing project dependencies..."
npm install pg set-interval-async --legacy-peer-deps

# Create logs directory if it doesn't exist
mkdir -p logs

# Ensure current user owns the logs directory
sudo chown -R $USER:$USER logs

# Start the scheduler with PM2
echo "Starting scheduler with PM2..."
pm2 delete god-scheduler 2>/dev/null || true
pm2 start scripts/scheduler-worker.js --name god-scheduler

# Save PM2 configuration
echo "Saving PM2 configuration..."
pm2 save

# Setup PM2 to start on boot (for WSL)
echo "Setting up PM2 startup..."
sudo env PATH=$PATH:/usr/local/bin pm2 startup systemd -u $USER --hp $HOME

echo "Scheduler setup complete!"
echo "Use the following commands to manage the scheduler:"
echo "  pm2 status god-scheduler    - Check status"
echo "  pm2 logs god-scheduler      - View logs"
echo "  pm2 restart god-scheduler   - Restart scheduler"
echo "  pm2 stop god-scheduler      - Stop scheduler" 