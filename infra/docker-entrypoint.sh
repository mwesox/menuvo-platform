#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/packages/db
bunx drizzle-kit migrate

echo "Starting API server..."
cd /app/apps/api
exec bun dist/index.js
