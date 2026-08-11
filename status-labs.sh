#!/bin/bash

# ============================================
# VULNLAB - Lab Status Check Script
# ============================================

ROUTES_FILE="/home/nguyenduccanh/Documents/vulnlab/ctf-labs/lab-routes.json"

echo "=========================================="
echo "VULNLAB - Lab Status"
echo "=========================================="

# Check docker containers
echo "[+] Docker containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(lab-|CONTAINER)"

echo ""
echo "[+] Lab routes (gateway port 7777):"
cat /home/nguyenduccanh/Documents/vulnlab/ctf-labs/lab-routes.json | jq -r 'to_entries[] | "\(.key) -> \(.value)"'

echo ""
echo "[+] Gateway status (port 7777):"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:7777/health 2>/dev/null | grep -q "200"; then
    echo "    Gateway: RUNNING"
else
    echo "    Gateway: NOT RUNNING (start with: cd /home/nguyenduccanh/Documents/vulnlab/ctf-labs && npm start)"
fi
