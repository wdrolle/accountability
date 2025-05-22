#!/bin/bash
# chmod +x scripts/remove_zone_identifiers.sh
# ./scripts/remove_zone_identifiers.sh

# Find all Zone.Identifier files recursively from the current directory
echo "Searching for Zone.Identifier files..."

# Using a more precise find command with -regex
find . -type f -regextype posix-extended -regex ".*Zone\.Identifier$" | while read -r file; do
    echo "Removing: $file"
    rm -f "$file"
done

# Alternative method using find with -exec for direct removal
# find . -type f -regextype posix-extended -regex ".*Zone\.Identifier$" -exec rm -f {} \;

echo "Completed removing Zone.Identifier files" 