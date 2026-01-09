# Gatus Status Page
FROM twinproduction/gatus:latest

# Install wget for health checks (Coolify requires it)
USER root
RUN apk add --no-cache wget
USER gatus

# Copy configuration
COPY gatus.yaml /config/config.yaml

# Gatus runs on port 8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost:8080/health || exit 1
