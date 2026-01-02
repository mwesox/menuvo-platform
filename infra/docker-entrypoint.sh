#!/bin/sh
set -e

# Run migrations only for platform server (not workers)
if [ "$1" = "bun" ] && [ "$2" = ".output/server/index.mjs" ]; then
    echo "Running database migrations..."
    bunx drizzle-kit migrate
fi

exec "$@"
