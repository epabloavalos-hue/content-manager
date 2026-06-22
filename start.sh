#!/bin/sh

echo "=== START ==="
echo "NODE_ENV: $NODE_ENV"
echo "DATABASE_URL: $DATABASE_URL"
echo "PWD: $(pwd)"
ls -la

echo "=== Creating data dirs ==="
mkdir -p /data/avatars /data/user-bg /data/proof || echo "mkdir failed"

echo "=== Running prisma push ==="
node_modules/.bin/prisma db push --accept-data-loss || echo "prisma push failed"

echo "=== Starting server ==="
exec node server.js
