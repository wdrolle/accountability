#!/bin/bash
# This script is used to fix a commit by stashing any uncommitted changes, fetching the latest changes, switching to the main branch, creating a new branch, applying the saved changes, staging and committing the changes, and pushing to the new branch.
# permission: chmod +x scripts/git-fix-commit.sh
# usage: ./scripts/git-fix-commit.sh

# Function to handle errors
handle_error() {
    echo "Error: $1"
    exit 1
}

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    handle_error "Not in a git repository"
fi

echo "Starting git fix process..."

# 1. Save any uncommitted changes
echo "Stashing changes..."
git stash || handle_error "Failed to stash changes"

# 2. Get latest changes from remote
echo "Fetching latest changes..."
git fetch origin || handle_error "Failed to fetch from remote"

# 3. Switch to main and update it
echo "Updating main branch..."
git checkout main || handle_error "Failed to checkout main"
git pull origin main || handle_error "Failed to pull latest changes"

# 4. Create a new branch
BRANCH_NAME="god-chat/$(date +"%m-%d-%Y-%H-%M")"
echo "Creating new branch: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME" || handle_error "Failed to create new branch"

# 5. Apply your saved changes
echo "Applying stashed changes..."
git stash pop || handle_error "Failed to apply stashed changes"

# 6. Stage and commit changes
echo "Staging changes..."
git add . || handle_error "Failed to stage changes"

# Get commit message from user
echo "Enter commit message (press Enter to use default message): "
read COMMIT_MESSAGE
COMMIT_MESSAGE=${COMMIT_MESSAGE:-"Update bible chat with rate limiting and error handling"}

echo "Committing changes..."
git commit -m "$COMMIT_MESSAGE" || handle_error "Failed to commit changes"

# 7. Push to new branch
echo "Pushing to remote..."
git push origin HEAD || handle_error "Failed to push changes"

echo "Success! Changes have been committed and pushed to branch: $BRANCH_NAME"
echo "You can now create a pull request from this branch to main" 