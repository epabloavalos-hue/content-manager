#!/bin/sh
set -e

mkdir -p /data/avatars /data/user-bg /data/proof

node_modules/.bin/prisma db push --accept-data-loss

exec node server.js
