#!/bin/bash

# ============================================
# VULNLAB - Lab Status Check Script
# ============================================
# Dynamic paths based on script location

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROUTES_FILE="$SCRIPT_DIR/ctf-labs/lab-routes.json"

echo "=========================================="
echo "VULNLAB - Lab Status"
echo "=========================================="
echo "[+] Project root: $SCRIPT_DIR"

# Check docker containers
echo "[+] Docker containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(lab-|CONTAINER)"

echo ""
echo "[+] Lab routes (gateway port 7777):"
if [ -f "$ROUTES_FILE" ]; then
    cat "$ROUTES_FILE" | jq -r 'to_entries[] | "\(.key) -> \(.value)"'
else
    echo "Routes file not found: $ROUTES_FILE"
fi

echo ""
echo "[+] Gateway status (port 7777):"
# Try to check gateway
GATEWAY_URL="http://localhost:7777"
if curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$GATEWAY_URL" 2>/dev/null | grep -q "200\|404"; then
    echo "    Gateway: RUNNING"
else
    echo "    Gateway: NOT RUNNING (start with: cd $SCRIPT_DIR/ctf-labs && npm start)"
fi
