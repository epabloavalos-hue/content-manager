#!/bin/sh
set -e

# Create persistent data directories
mkdir -p /data/avatars /data/user-bg /data/proof

# Run DB migrations
npx prisma db push --accept-data-loss

# Start the app
exec node .next/standalone/server.js
