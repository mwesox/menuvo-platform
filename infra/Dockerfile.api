# Menuvo API Dockerfile
# Hono + tRPC API server with Bun runtime
#
# Usage:
#   API Server: CMD ["bun", "dist/index.js"] (default)
#   Migrations: docker compose run --rm api bunx drizzle-kit migrate

FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Install vips for sharp
RUN apk add --no-cache vips-dev

# Copy workspace root files
COPY package.json turbo.json ./

# Copy all package.json files for workspace resolution
COPY packages/db/package.json ./packages/db/
COPY packages/ui/package.json ./packages/ui/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/api/package.json ./apps/api/
COPY apps/console/package.json ./apps/console/
COPY apps/shop/package.json ./apps/shop/
COPY apps/business/package.json ./apps/business/

# Install dependencies (skip lifecycle scripts to avoid native module issues)
RUN bun install --ignore-scripts

# Copy source code (includes drizzle.config.ts in packages/db)
COPY packages/db ./packages/db
COPY apps/api ./apps/api

# Build API
WORKDIR /app/apps/api
RUN bun run build

# Production image
FROM oven/bun:1-alpine
WORKDIR /app

# Install vips for sharp (runtime dependency)
RUN apk add --no-cache vips

# Create non-root user for security
RUN addgroup -S menuvo && adduser -S menuvo -G menuvo

# Copy node_modules (includes correctly built sharp)
COPY --from=builder --chown=menuvo:menuvo /app/node_modules ./node_modules

# Copy built API
COPY --from=builder --chown=menuvo:menuvo /app/apps/api/dist ./dist

# Copy drizzle migrations and config from packages/db
COPY --from=builder --chown=menuvo:menuvo /app/packages/db/drizzle ./packages/db/drizzle
COPY --from=builder --chown=menuvo:menuvo /app/packages/db/drizzle.config.ts ./packages/db/

# Copy package files for drizzle-kit to work
COPY --from=builder --chown=menuvo:menuvo /app/packages/db/package.json ./packages/db/
COPY --from=builder --chown=menuvo:menuvo /app/packages/db ./packages/db

USER menuvo:menuvo

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -q --spider http://localhost:3000/health || exit 1

EXPOSE 3000

# Run API server
CMD ["bun", "dist/index.js"]
