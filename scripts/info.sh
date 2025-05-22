# info.sh
# Display system information
# permission: chmod +x info.sh
# Run with: ./info.sh

#!/bin/bash

# Function to display IP address(es)
show_ip() {
    echo "=== IP Address(es) ==="
    # Shows all IP addresses associated with the machine
    hostname -I 2>/dev/null || echo "Unable to retrieve IP address."
    echo
}

# Function to display CPU usage (one-time snapshot)
show_cpu() {
    echo "=== CPU Usage ==="
    # Using top in batch mode, one iteration, grep Cpu line
    top -bn1 | grep "Cpu(s)" || echo "Unable to retrieve CPU usage."
    echo
}

# Function to display GPU usage if nvidia-smi is present
show_gpu() {
    if command -v nvidia-smi &> /dev/null; then
        echo "=== GPU Usage ==="
        nvidia-smi || echo "Unable to retrieve GPU info."
        echo
    else
        echo "=== GPU Usage ==="
        echo "nvidia-smi not found. Skipping GPU info."
        echo
    fi
}

# Function to display memory info
show_memory() {
    echo "=== Memory Info ==="
    # free -h shows human-readable memory info
    free -h || echo "Unable to retrieve memory info."
    echo
}

# Function to offer option to drop caches (requires sudo)
drop_caches() {
    echo "Do you want to attempt to free up memory by dropping caches? (y/n)"
    read -r answer
    if [[ $answer == "y" || $answer == "Y" ]]; then
        # Attempt to drop caches
        # Requires root privileges
        if [ "$EUID" -ne 0 ]; then
            echo "You are not running as root. Attempting to use sudo..."
            sudo sh -c 'sync; echo 3 > /proc/sys/vm/drop_caches' && echo "Memory caches dropped." || echo "Failed to drop caches."
        else
            sync; echo 3 > /proc/sys/vm/drop_caches && echo "Memory caches dropped." || echo "Failed to drop caches."
        fi
    else
        echo "Skipping cache drop."
    fi
    echo
}


# Main
show_ip
show_cpu
show_gpu
show_memory
drop_caches
