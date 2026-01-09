# Gatus Status Page
FROM twinproduction/gatus:latest

# Copy configuration
COPY gatus.yaml /config/config.yaml

# Gatus runs on port 8080
EXPOSE 8080

# Note: No HEALTHCHECK - Coolify will use HTTP check on /health endpoint
