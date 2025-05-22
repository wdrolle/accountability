#!/bin/bash
# This script updates the current branch with the latest changes from the main branch
# permission: chmod +x scripts/update-from-main.sh
# command to run: ./scripts/update-from-main.sh

# Exit on error
set -e

# Store the current directory
CURRENT_DIR=$(pwd)

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
echo "Created temporary directory: $TEMP_DIR"

# Clone the repository into the temporary directory
git clone --depth 1 --branch main https://github.com/wdrolle/god-messages.git "$TEMP_DIR"

# Copy all files except .git directory to the current directory
rsync -av --exclude='.git' "$TEMP_DIR/" "$CURRENT_DIR/"

# Clean up temporary directory
rm -rf "$TEMP_DIR"
echo "Successfully updated from main branch" 