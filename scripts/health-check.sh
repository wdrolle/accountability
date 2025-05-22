#!/bin/bash

# Permission: chmod +x scripts/health-check.sh
# Command to run: ./scripts/health-check.sh

# Function to check if a port is open
check_port() {
    local port=$1
    local service=$2
    nc -z localhost $port
    if [ $? -eq 0 ]; then
        echo "✓ $service is running on port $port"
    else
        echo "✗ $service is not running on port $port"
    fi
}

# Check all required services
echo "Checking services..."
check_port 3000 "Next.js"
check_port 3002 "Twilio Service"
check_port 11434 "Ollama"

# Check if processes are running
echo -e "\nChecking processes..."
ps aux | grep -E "next|twilio|ollama" | grep -v grep

# Check network status
echo -e "\nChecking network..."
curl -s -o /dev/null -w "Next.js Status: %{http_code}\n" http://localhost:3000 || echo "Next.js not responding"
curl -s -o /dev/null -w "Ollama Status: %{http_code}\n" http://localhost:11434 || echo "Ollama not responding"

# Check firewall
echo -e "\nChecking firewall..."
sudo ufw status verbose 