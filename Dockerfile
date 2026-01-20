# Menuvo API Dockerfile
# Hono + tRPC API server with Bun runtime
#
# Usage:
#   API Server: CMD ["bun", "dist/index.js"] (default)
#   Migrations: docker compose run --rm api bunx drizzle-kit migrate

FROM oven/bun:1-alpine AS base
WORKDIR /app

# Install vips for sharp
RUN apk add --no-cache vips-dev

# Install dependencies into temp directory (caches them for faster builds)
FROM base AS install

# Copy workspace root files
RUN mkdir -p /temp/dev
COPY package.json bun.lock turbo.json /temp/dev/

# Copy all package.json files for workspace resolution
COPY packages/db/package.json /temp/dev/packages/db/
COPY packages/ui/package.json /temp/dev/packages/ui/
COPY packages/typescript-config/package.json /temp/dev/packages/typescript-config/
COPY apps/api/package.json /temp/dev/apps/api/
COPY apps/console/package.json /temp/dev/apps/console/
COPY apps/shop/package.json /temp/dev/apps/shop/
COPY apps/business/package.json /temp/dev/apps/business/

# Install all dependencies
RUN cd /temp/dev && bun install --frozen-lockfile --ignore-scripts

# Build stage
FROM base AS prerelease
WORKDIR /app

# Copy node_modules from temp directory (includes all workspace deps)
COPY --from=install /temp/dev/node_modules ./node_modules
COPY --from=install /temp/dev/apps/api/node_modules ./apps/api/node_modules
COPY --from=install /temp/dev/packages/db/node_modules ./packages/db/node_modules

# Copy source code
COPY packages/db ./packages/db
COPY apps/api ./apps/api

# Build API
WORKDIR /app/apps/api
ENV NODE_ENV=production
RUN bun run build

# Production image
FROM oven/bun:1-alpine AS release
WORKDIR /app

# Install vips for sharp (runtime dependency)
RUN apk add --no-cache vips

# Create non-root user for security
RUN addgroup -S menuvo && adduser -S menuvo -G menuvo

# Copy node_modules preserving workspace structure for module resolution
# Bun resolves modules by walking up from the entry point
COPY --from=install --chown=menuvo:menuvo /temp/dev/node_modules ./node_modules
COPY --from=install --chown=menuvo:menuvo /temp/dev/apps/api/node_modules ./apps/api/node_modules
COPY --from=install --chown=menuvo:menuvo /temp/dev/packages/db/node_modules ./packages/db/node_modules

# Copy built API to apps/api/dist (preserves workspace structure for module resolution)
COPY --from=prerelease --chown=menuvo:menuvo /app/apps/api/dist ./apps/api/dist

# Copy drizzle migrations and config from packages/db
COPY --from=prerelease --chown=menuvo:menuvo /app/packages/db/drizzle ./packages/db/drizzle
COPY --from=prerelease --chown=menuvo:menuvo /app/packages/db/drizzle.config.ts ./packages/db/
COPY --from=prerelease --chown=menuvo:menuvo /app/packages/db/package.json ./packages/db/
COPY --from=prerelease --chown=menuvo:menuvo /app/packages/db ./packages/db

# Copy entrypoint script
COPY --chown=menuvo:menuvo infra/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

USER menuvo:menuvo

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check (longer start period for migrations)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -q --spider http://localhost:3000/health || exit 1

EXPOSE 3000

# Run migrations then start API server
ENTRYPOINT ["/app/docker-entrypoint.sh"]
