#!/bin/bash
# This script connects to the database using the DIRECT_URL from .env
# chmod +x scripts/db-connect.sh
# ./scripts/db-connect.sh

# Load environment variables
source .env

# Connect using full connection URL
psql "${DIRECT_URL}?sslmode=require" "$@"