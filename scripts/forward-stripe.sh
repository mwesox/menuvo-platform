#!/bin/bash
# Forward Stripe webhooks to local TanStack Start server
# Forwards all Stripe events to /api/webhooks/stripe

# Get script directory to make paths work regardless of where script is called from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env.local"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo "Starting Stripe webhook forwarding..."
echo ""

# Check if env file exists
if [[ ! -f "$ENV_FILE" ]]; then
    echo -e "${RED}Error:${NC} Environment file not found: $ENV_FILE"
    echo "  Make sure .env.local exists in project root."
    exit 1
fi

# Read configured secret
CONFIGURED_SECRET=$(grep "^STRIPE_WEBHOOK_SECRET=" "$ENV_FILE" | cut -d'=' -f2)

echo -e "${CYAN}Configured secret in .env.local:${NC}"
if [[ -n "$CONFIGURED_SECRET" ]]; then
    echo -e "  ${GREEN}STRIPE_WEBHOOK_SECRET${NC} = ${YELLOW}${CONFIGURED_SECRET}${NC}"
else
    echo -e "  ${RED}STRIPE_WEBHOOK_SECRET${NC} = (not set)"
fi

echo ""
echo -e "${CYAN}Fetching Stripe CLI webhook secret...${NC}"

# Get CLI secret
CLI_SECRET=$(stripe listen --print-secret 2>/dev/null)

if [[ -n "$CLI_SECRET" ]]; then
    echo -e "  CLI Secret: ${YELLOW}${CLI_SECRET}${NC}"
else
    echo -e "  ${RED}Could not get secret. Run: stripe login${NC}"
    exit 1
fi

# Check for mismatch
echo ""
if [[ "$CONFIGURED_SECRET" != "$CLI_SECRET" ]]; then
    echo -e "${YELLOW}⚠ Secret mismatch! Update .env.local:${NC}"
    echo -e "  STRIPE_WEBHOOK_SECRET=${CLI_SECRET}"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}Starting webhook listener...${NC}"
echo "  → http://localhost:3000/api/webhooks/stripe"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Cleanup on exit
cleanup() {
    echo ""
    echo "Stopping webhook forwarder..."
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start snapshot listener (handles all standard Stripe events)
# Note: Thin events (V2) require specific event types, not wildcards
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
