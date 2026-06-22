#!/bin/sh
mkdir -p /data/avatars /data/user-bg /data/proof 2>/dev/null || true
node_modules/.bin/prisma db push --accept-data-loss 2>/dev/null || true
exec node_modules/.bin/next start -p ${PORT:-3000} -H 0.0.0.0
