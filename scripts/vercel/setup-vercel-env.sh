#!/bin/bash
# run this script to setup the vercel environment variables
# run this script in the root of the project
# permissions: chmod +x setup-vercel-env.sh
# to run: bash setup-vercel-env.sh
# Read .env.local and process each line
while IFS= read -r line; do
    # Skip empty lines and comments
    if [[ -z "$line" ]] || [[ "$line" =~ ^#.* ]]; then
        continue
    fi
    
    # Extract key and value
    if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
        key="${BASH_REMATCH[1]}"
        value="${BASH_REMATCH[2]}"
        
        # Remove any trailing comments
        value="${value%%#*}"
        
        # Trim whitespace
        key="$(echo -e "${key}" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
        value="$(echo -e "${value}" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
        
        echo "Adding $key to production..."
        vercel env add "$key" production "$value"
    fi
done < ".env.local" 