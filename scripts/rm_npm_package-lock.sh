#!/bin/bash

# Remove package-lock.json if it exists
# chmod +x scripts/rm_npm_package-lock.sh
# ./scripts/rm_npm_package-lock.sh

echo "Starting cleanup process..."

# Remove package-lock.json if it exists
if [ -f package-lock.json ]; then
    echo "Removing package-lock.json..."
    rm package-lock.json
else
    echo "No package-lock.json found"
fi

# Remove node_modules if it exists
if [ -d node_modules ]; then
    echo "Removing node_modules directory..."
    rm -rf node_modules
else
    echo "No node_modules directory found"
fi

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force

# Reinstall packages
echo "Reinstalling packages..."
npm install

echo "Cleanup complete!" 