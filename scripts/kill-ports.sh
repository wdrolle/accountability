#!/bin/bash
# This script kills processes running on specified ports
# permission: chmod +x scripts/kill-ports.sh
# command to run: ./scripts/kill-ports.sh

# "Killed process $pid 😈" when successfully killing a process
# "No process found on port $port 🤷" when nothing is found
# "Ports cleared 🎉" when everything is done

# Function to kill process on a specific port
kill_port() {
    local port=$1
    echo "Attempting to kill process on port $port..."
    
    # Try lsof first
    local pid=$(lsof -ti :$port)
    
    if [ ! -z "$pid" ]; then
        echo "Found process $pid on port $port"
        kill -9 $pid
        echo "Killed process $pid 😈"
    else
        # Try netstat as fallback
        pid=$(netstat -tulpn 2>/dev/null | grep ":$port" | awk '{print $7}' | cut -d'/' -f1)
        if [ ! -z "$pid" ]; then
            echo "Found process $pid on port $port using netstat"
            kill -9 $pid
            echo "Killed process $pid 😈"
        else
            # Try fuser as last resort
            pid=$(fuser $port/tcp 2>/dev/null)
            if [ ! -z "$pid" ]; then
                echo "Found process $pid on port $port using fuser"
                kill -9 $pid
                echo "Killed process $pid 😈"
            else
                echo "No process found on port $port 🤷"
            fi
        fi
    fi
}

# Kill processes on specific ports
kill_port 3000
kill_port 3001
kill_port 3002
kill_port 4040
kill_port 4041
kill_port 11434

# Kill ngrok if running
pkill -f "ngrok" || true

echo "Ports cleared 🎉" 