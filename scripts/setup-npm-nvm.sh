#!/bin/bash
# This script is used to setup npm and nvm on a new machine
# permission: chmod +x scripts/setup-npm-nvm.sh
# command to run: ./scripts/setup-npm-nvm.sh

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "Starting setup process..."

# Clean up existing directories with proper permissions
echo "Cleaning up existing directories..."
if [ -d "node_modules" ]; then
    echo "Removing node_modules directory..."
    chmod -R 777 node_modules
    rm -rf node_modules
    if [ -d "node_modules" ]; then
        echo "Attempting forced removal with sudo..."
        sudo rm -rf node_modules
    fi
fi

if [ -d ".next" ]; then
    echo "Removing .next directory..."
    chmod -R 777 .next
    rm -rf .next
    if [ -d ".next" ]; then
        sudo rm -rf .next
    fi
fi

if [ -d "agents-api" ]; then
    echo "Removing agents-api directory..."
    chmod -R 777 agents-api
    rm -rf agents-api
    if [ -d "agents-api" ]; then
        sudo rm -rf agents-api
    fi
fi

# Verify cleanup
echo "Verifying cleanup..."
if [ -d "node_modules" ] || [ -d ".next" ] || [ -d "agents-api" ]; then
    echo "Error: Failed to remove some directories. Please remove them manually."
    exit 1
fi

# Install curl if not already installed
if ! command_exists curl; then
    echo "Installing curl..."
    sudo apt-get update
    sudo apt-get install -y curl
fi

# Install NVM
echo "Installing nvm..."
export NVM_DIR="$HOME/.nvm"
if [ ! -d "$NVM_DIR" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    source "$NVM_DIR/nvm.sh"
fi

# Add nvm to bash profile if not already present
if ! grep -q NVM_DIR ~/.bashrc; then
    {
        echo 'export NVM_DIR="$HOME/.nvm"'
        echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"'
        echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"'
    } >> ~/.bashrc
fi

# Source NVM
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install and use Node.js
echo "Installing Node.js v20.10.0..."
nvm install 20.10.0
nvm use 20.10.0

# Install Ollama if not already installed
if ! command_exists ollama; then
    echo "Installing Ollama..."
    sudo apt update
    sudo apt upgrade -y
    curl -fsSL https://ollama.com/install.sh | sh
    
    # Only try to pull and serve if installation was successful
    if command_exists ollama; then
        ollama pull llama3.2
        ollama pull deepseek-r1:8b
        # Check if ollama is already running
        if ! pgrep -x "ollama" > /dev/null; then
            ollama serve &
        fi
    fi
fi

sudo apt-get update && \
sudo apt-get install -y build-essential cmake
sudo apt-get install -y pkgconf
sudo apt-get install -y gtkmm-3.0

sudo apt-get install -y --no-install-recommends --no-install-suggests \
    libx11-xcb1 \
    libxcb-xfixes0 \
    libxcb-shape0 \
    libxcb-shm0 \
    libxcb-randr0 \
    libxcb-image0 \
    libxcb-keysyms1 \
    libxcb-xtest0

# Install jszip file-saver @types/file-saver
npm install jszip file-saver @types/file-saver --legacy-peer-deps

# Install nextui
npm install @nextui-org/react framer-motion @iconify/react --legacy-peer-deps

# Install radix-ui/react-scroll-area
npm install @radix-ui/react-scroll-area --legacy-peer-deps

# Install jsonwebtoken
npm install --save-dev @types/jsonwebtoken --legacy-peer-deps

# Install zoom sdk
npm install @zoom/meetingsdk --legacy-peer-deps

# Install meteor
npx meteor

# Install isomorphic-dompurify
npm install isomorphic-dompurify --legacy-peer-deps

# Install swr
npm install swr --legacy-peer-deps

# Clear npm cache and install dependencies
echo "Setting up npm and installing dependencies..."
npm cache clean --force

# Install aws-sdk
npm install @aws-sdk/client-s3 uuid --legacy-peer-deps

# Install tinymce
npm install @tinymce/tinymce-react --legacy-peer-deps
npm install --save-dev @types/tinymce --legacy-peer-deps

# Use a specific version of npm that's compatible with Node.js v20.10.0
echo "Installing compatible npm version..."
npm install -g npm@10.2.3 --legacy-peer-deps

# Install next globally
npm install -g next --legacy-peer-deps

# Install project dependencies
echo "Installing project dependencies..."
rm -rf package-lock.json
npm install --legacy-peer-deps --force

# Install type definitions and other dependencies
echo "Installing type definitions..."
npm install --save-dev @types/node @types/twilio --legacy-peer-deps

# Install polyfills for Node.js built-in modules
echo "Installing polyfills..."
npm install --save-dev crypto-browserify stream-browserify url stream-http https-browserify browserify-zlib assert os-browserify path-browserify process buffer --legacy-peer-deps

# Install aws-sdk
echo "Installing aws-sdk..."
npm install aws-sdk --legacy-peer-deps

# Install uuid
echo "Installing uuid..."
npm install uuid --legacy-peer-deps

# Install pg and set-interval-async
echo "Installing pg and set-interval-async..."
npm install pg set-interval-async --legacy-peer-deps

# Install react-use-websocket
echo "Installing react-use-websocket..."
npm install react-use-websocket --legacy-peer-deps

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma db pull
npx prisma generate
npx prisma format

# Restart TypeScript server
echo "Restarting TypeScript server..."
pkill -f "typescript-language-server"
pkill -f "tsserver"

# Build the project
echo "Building project..."
rm -rf .next
NODE_OPTIONS='--max-old-space-size=8192' npm run build

# Check if build was successful
if [ ! -d ".next" ]; then
    echo "Build failed! .next directory not found."
    exit 1
fi

# Wait for TS server to restart
sleep 2

# install client-polly in app
npm install @aws-sdk/client-polly --legacy-peer-deps

# Verify installations
echo "Verifying installations..."
node --version
npm --version
nvm --version

# Start the production server only if build was successful
echo "Starting production server..."
if [ -d ".next" ]; then
    npm run dev
else
    echo "Error: Build directory not found. Build may have failed."
    exit 1
fi

echo "Setup completed successfully!" 
